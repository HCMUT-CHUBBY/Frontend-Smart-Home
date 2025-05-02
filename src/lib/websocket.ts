// lib/websocket.ts (Hoặc đường dẫn tương tự)

import { Client, StompSubscription } from "@stomp/stompjs";

let stompClient: Client | null = null;

const socketUrl = "ws://localhost:8080/ws/sensor";

export const connectWebSocket = (
  token: string,
  onConnected: () => void,
  onError: (error: string) => void
): Promise<Client> => {
  return new Promise((resolve, reject) => {
    if (stompClient && stompClient.active) {
      console.warn(
        "STOMP client đang active, sẽ deactivate trước khi kết nối lại."
      );
      stompClient.deactivate();
    }
    console.log("Đang tạo STOMP client mới...");
    stompClient = new Client({
      brokerURL: socketUrl,
      connectHeaders: { Authorization: `Bearer ${token}` }, // Gửi token để xác thực
      reconnectDelay: 5000, // Tự động kết nối lại sau 5 giây nếu mất kết nối
      heartbeatIncoming: 0, // Check tín hiệu từ server mỗi 4 giây
      heartbeatOutgoing: 0, // Gửi tín hiệu tới server mỗi 4 giây

      onConnect: (frame) => {
        console.log("Kết nối WebSocket và STOMP thành công:", frame);
        onConnected(); // Gọi callback báo thành công
        resolve(stompClient!); // Trả về client đã kết nối
      },
      onStompError: (frame) => {
        // Lỗi từ STOMP broker (ví dụ: xác thực thất bại)
        console.error("Lỗi STOMP:", frame.headers["message"], frame.body);
        onError(`Lỗi STOMP: ${frame.headers["message"]}`);
        reject(new Error(`Lỗi STOMP: ${frame.headers["message"]}`)); // Reject promise
        // Có thể không cần deactivate ở đây vì nó có thể tự thử lại
      },
      onWebSocketError: (error) => {
        // Lỗi ở tầng WebSocket (ví dụ: không kết nối được tới URL)
        console.error("Lỗi WebSocket:", error);
        //onError(`Lỗi WebSocket: ${error.message}`);============================================
        reject(error); // Reject promise
      },
      onWebSocketClose: (event) => {
        console.log("WebSocket đã đóng:", event);
        // onError("WebSocket đã bị đóng. Đang thử kết nối lại..."); // Thông báo cho người dùng (tùy chọn)
        // reconnectDelay sẽ tự động xử lý việc kết nối lại
      },
    });

    console.log("Kích hoạt STOMP client...");
    stompClient.activate(); // Bắt đầu quá trình kết nối
  });
};

/**
 * Đăng ký lắng nghe tin nhắn từ một topic device cụ thể và kích hoạt lấy data ban đầu.
 * @param deviceId - ID của thiết bị cần subscribe.
 * @param onMessageReceived - Callback xử lý khi nhận được tin nhắn trên topic.
 * @returns Đối tượng StompSubscription để có thể hủy đăng ký sau này, hoặc null nếu thất bại.
 */
export const subscribeToDevice = (
  deviceId: string,
  onMessageReceived: (message: string) => void
): StompSubscription | null => {
  // <-- Trả về StompSubscription | null
  if (stompClient && stompClient.connected) {
    // Kiểm tra connected thay vì active
    try {
      console.log(`Đang subscribe topic /topic/devices/${deviceId}`);
      // Hàm subscribe trả về đối tượng StompSubscription
      const subscription: StompSubscription = stompClient.subscribe(
        `/topic/devices/${deviceId}`,
        (message) => {
          // console.log(`Nhận message từ ${deviceId}:`, message.body);
          onMessageReceived(message.body); // Gọi callback xử lý message
        },
        { id: `sub-${deviceId}` } // Gán ID cho subscription (hữu ích cho debug)
      );

      console.log(
        `Đã subscribe thành công ${deviceId} (Sub ID: ${subscription.id}). Kích hoạt lấy data ban đầu...`
      );

      // Gửi message tới /app/{deviceId}/subscribe để kích hoạt backend
      // gửi lại data ban đầu thông qua @SendTo("/topic/devices/{id}")
      // stompClient.publish({
      //   destination: `/app/${deviceId}/subscribe`,
      //   body: "", // Không cần body cho việc trigger này
      // });

      return subscription; // Trả về đối tượng subscription thành công
    } catch (e) {
      console.error(`Lỗi khi subscribe vào device ${deviceId}:`, e);
      return null; // Trả về null nếu có lỗi trong quá trình subscribe
    }
  } else {
    console.error(
      `STOMP client chưa kết nối khi cố gắng subscribe vào ${deviceId}.`
    );
    return null; // Trả về null nếu client không kết nối
  }
};

/**
 * Gửi một lệnh điều khiển tới một thiết bị cụ thể qua WebSocket.
 * @param deviceId - ID của thiết bị nhận lệnh.
 * @param command - Đối tượng lệnh chứa action và value.
 */
export const publishToDevice = (
  deviceId: string,
  command: { action: string; value: string }
) => {
  if (stompClient && stompClient.connected) {
    // Kiểm tra connected
    try {
      const destination = `/app/${deviceId}/publish`;
      const body = JSON.stringify(command);
      console.log(`>>> Gửi lệnh tới ${destination}:`, command);

      stompClient.publish({
        destination: destination,
        body: body,
      });
      // Lưu ý: Publish là gửi đi, không có xác nhận trực tiếp ở đây.
      // Việc xử lý thành công/thất bại của lệnh cần được phản hồi từ backend
      // (ví dụ: qua message trên topic hoặc cách khác).
    } catch (e) {
      console.error(`!!! Lỗi khi publish lệnh cho ${deviceId}:`, e);
      alert(`Có lỗi xảy ra khi gửi lệnh đến thiết bị ${deviceId}.`);
    }
  } else {
    console.error(
      `>>> Không thể publish: Client chưa kết nối. StompClient:`,
      stompClient
    );
    alert("Không thể gửi lệnh do mất kết nối đến server.");
  }
};

/**
 * Hủy đăng ký lắng nghe tin nhắn từ một topic đã subscribe trước đó.
 * @param subscription - Đối tượng StompSubscription cần hủy.
 */
export const unsubscribeFromDevice = (
  subscription: StompSubscription | null
) => {
  if (subscription) {
    try {
      const subId = subscription.id;
      subscription.unsubscribe(); // Gọi hàm hủy của đối tượng subscription
      console.log(`Đã hủy subscribe thành công (ID: ${subId}).`);
    } catch (e) {
      console.error(`Lỗi khi hủy subscribe (ID: ${subscription?.id}):`, e);
    }
  } else {
    // console.warn("Cố gắng hủy một subscription null hoặc undefined.");
  }
};

/**
 * Ngắt kết nối STOMP và đóng WebSocket.
 * Cần đảm bảo đã gọi unsubscribeFromDevice cho tất cả các subscription trước khi gọi hàm này.
 */
// lib/websocket.ts
export const disconnectWebSocket = () => {
  // Thêm kiểm tra .connected
  if (stompClient && stompClient.connected && stompClient.active) {
    console.log("STOMP client is connected and active. Deactivating...");
    try {
      stompClient.deactivate(); // Gọi deactivate
      console.log("STOMP client deactivate called.");
    } catch (e) {
      console.error("Error during stompClient.deactivate():", e);
    } finally {
      stompClient = null; // Vẫn set về null
    }
  } else if (stompClient && stompClient.active) {
    // Trường hợp active nhưng không connected? Vẫn thử deactivate
    console.warn(
      "STOMP client is active but not connected. Attempting deactivate anyway..."
    );
    try {
      stompClient.deactivate();
      console.log(
        "STOMP client deactivate called (was active but not connected)."
      );
    } catch (e) {
      console.error(
        "Error during stompClient.deactivate() (active but not connected):",
        e
      );
    } finally {
      stompClient = null;
    }
  } else {
    console.log(
      "STOMP client not active or already null. No need to disconnect."
    );
  }
};
/**
 * (Tùy chọn) Lấy instance của stompClient nếu cần truy cập trực tiếp (hạn chế sử dụng).
 * @returns Đối tượng Client STOMP hiện tại hoặc null.
 */
export const getStompClient = (): Client | null => {
  return stompClient;
};
