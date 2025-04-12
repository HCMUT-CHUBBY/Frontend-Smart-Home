"use client";

import { useState, FormEvent } from "react"; // Import FormEvent
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from '@/styles/login.module.scss'; // Đảm bảo import đúng đường dẫn và tên file

export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Thêm state loading cho rõ ràng
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => { // Sử dụng FormEvent
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false, // Xử lý redirect thủ công
      });

      if (result?.error) {
        // Có thể thêm logic phân tích lỗi cụ thể hơn nếu cần
        setError("Tên đăng nhập hoặc mật khẩu không chính xác.");
        console.error("Sign-in error:", result.error);
      } else if (result?.ok) {
        router.push("/dashboard"); // Chuyển hướng thành công
      } else {
        setError("Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      setError("Đã xảy ra lỗi mạng hoặc lỗi không mong muốn.");
      console.error("Unexpected error during sign-in:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Áp dụng class từ SCSS module
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Đăng Nhập</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Bỏ div.formGroup vì dùng gap trong .form */}
          <div>
            <label htmlFor="username" className={styles.label}>
              Tên đăng nhập
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username"
              className={styles.input} // Class cho input
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className={styles.label}>
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className={styles.input} // Class cho input
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className={styles.button} // Class cho button
            disabled={isLoading}
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </button>
        </form>
        {/* Hiển thị lỗi */}
        {error && <p className={styles.error}>{error}</p>}
        {/* Link đăng ký */}
        <p className={styles.link}>
          Chưa có tài khoản?{' '}
          <Link href="/auth/register">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}