import { useState } from "react";
import { supabase } from "./lib/supabase";
import "./App.css";
import logo from "./assets/logo.png";

export default function Auth() {

    const [isLogin, setIsLogin] = useState(true);

    const [fullname, setFullname] = useState("");
    const [studentId, setStudentId] = useState("");
    const [phone, setPhone] = useState("");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);

    async function handleSubmit() {

        setLoading(true);

        if (isLogin) {

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            setLoading(false);

            if (error) {
                alert(error.message);
                return;
            }

            alert("Đăng nhập thành công!");
            return;
        }

        if (
            fullname === "" ||
            studentId === "" ||
            phone === "" ||
            email === "" ||
            password === "" ||
            confirmPassword === ""
        ) {
            alert("Vui lòng nhập đầy đủ thông tin.");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            alert("Mật khẩu không khớp.");
            setLoading(false);
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            setLoading(false);
            alert(error.message);
            return;
        }

        if (data.user) {

            await supabase
                .from("profiles")
                .insert({
                    id: data.user.id,
                    fullname,
                    student_id: studentId,
                    phone
                });

        }

        setLoading(false);

        alert("Đăng ký thành công!");

        setIsLogin(true);

        setPassword("");
        setConfirmPassword("");
    }

    return (

        <div className="auth-page">

            <div className="auth-left">
                <img src={logo} className="auth-logo"/>
                <div className="library-title">

                    <h1>THƯ VIỆN</h1>

                    <h2>ĐIỆN TỬ UTH</h2>

                </div>

                <p>
                    Hệ thống mượn và quản lý sách trực tuyến.
                </p>

                <div className="feature-list">
                    <div className="feature-item">📚 <span>Hơn 50.000 đầu sách</span></div>
                    <div className="feature-item">📖 <span>Ebook miễn phí</span></div>
                    <div className="feature-item">💻 <span>Mượn sách trực tuyến</span></div>
                    <div className="feature-item">⭐ <span>Tra cứu nhanh chóng</span></div>
                </div>

            </div>

            <div className="auth-right">

                <div className="auth-card">

                    <h2>

                        {isLogin
                            ? "Đăng nhập"
                            : "Đăng ký"}

                    </h2>

                    {
                        !isLogin &&
                        <>
                            <input
                                placeholder="Họ và tên"
                                value={fullname}
                                onChange={(e) =>
                                    setFullname(e.target.value)
                                }
                            />

                            <input
                                placeholder="Mã sinh viên"
                                value={studentId}
                                onChange={(e) =>
                                    setStudentId(e.target.value)
                                }
                            />

                            <input
                                placeholder="Số điện thoại"
                                value={phone}
                                onChange={(e) =>
                                    setPhone(e.target.value)
                                }
                            />
                        </>
                    }

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                    />

                    <input
                        type="password"
                        placeholder="Mật khẩu"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />

                    {
                        !isLogin &&
                        <input
                            type="password"
                            placeholder="Nhập lại mật khẩu"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                        />
                    }

                    <button
                        className="auth-btn"
                        onClick={handleSubmit}
                    >
                        {
                            loading
                                ? "Đang xử lý..."
                                : isLogin
                                    ? "Đăng nhập"
                                    : "Đăng ký"
                        }
                    </button>

                    <p className="switch-auth">

                        {
                            isLogin
                                ? "Chưa có tài khoản?"
                                : "Đã có tài khoản?"
                        }

                        <span
                            onClick={() =>
                                setIsLogin(!isLogin)
                            }
                        >
                            {
                                isLogin
                                    ? " Đăng ký"
                                    : " Đăng nhập"
                            }
                        </span>

                    </p>

                </div>

            </div>

        </div>

    );

}