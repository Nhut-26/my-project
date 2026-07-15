import { useState } from "react";
import { supabase } from "./lib/supabase";
import "./App.css";
import logo from "./assets/logo.png";

const FEATURES = [
    { icon: "📚", label: "Kho sách", value: "50.000+" },
    { icon: "📖", label: "Ebook", value: "Miễn phí" },
    { icon: "💻", label: "Mượn trực tuyến", value: "24/7" },
    { icon: "⭐", label: "Tra cứu", value: "Tức thì" },
];

const SPINES = [
    { h: 46, c: "#e0b354" },
    { h: 64, c: "#c97b4a" },
    { h: 38, c: "#8fc0b9" },
    { h: 56, c: "#f2ede1" },
    { h: 30, c: "#c97a6d" },
    { h: 50, c: "#e0b354" },
    { h: 40, c: "#8fc0b9" },
    { h: 60, c: "#c97b4a" },
    { h: 34, c: "#f2ede1" },
    { h: 52, c: "#c97a6d" },
    { h: 44, c: "#8fc0b9" },
    { h: 58, c: "#e0b354" },
];

export default function Auth() {

    const [isLogin, setIsLogin] = useState(true);

    const [fullname, setFullname] = useState("");
    const [studentId, setStudentId] = useState("");
    const [phone, setPhone] = useState("");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);

    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);

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
            password,
            options: {
                data: {
                    full_name: fullname,
                    name: fullname,
                    student_id: studentId,
                    phone
                }
            }
        });

        if (error) {
            setLoading(false);
            alert(error.message);
            return;
        }

        if (data.user) {

            const { error: insertError } = await supabase
                .from("profiles")
                .insert({
                    id: data.user.id,
                    full_name: fullname,
                    student_id: studentId,
                    phone,
                    email
                });

            if (insertError) {
                console.error(insertError);
                setLoading(false);
                alert("Tạo tài khoản thành công nhưng lưu thông tin cá nhân thất bại: " + insertError.message);
                return;
            }

        }

        setLoading(false);

        if (data.session) {
            // Email confirmation is disabled -> user is already signed in.
            alert("Đăng ký thành công! Bạn đã được đăng nhập.");
            return;
        }

        alert("Đăng ký thành công!");

        setIsLogin(true);

        setPassword("");
        setConfirmPassword("");
    }

    async function handleForgotPassword() {

        if (!resetEmail) {
            alert("Vui lòng nhập email của bạn.");
            return;
        }

        setResetLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
            redirectTo: window.location.origin,
        });

        setResetLoading(false);

        if (error) {
            alert(error.message);
            return;
        }

        setResetSent(true);
    }

    function openForgotPassword() {
        setResetEmail(email);
        setResetSent(false);
        setShowForgotPassword(true);
    }

    function closeForgotPassword() {
        setShowForgotPassword(false);
        setResetSent(false);
        setResetEmail("");
    }

    return (

        <div className="auth-page">

            <div className="auth-left">
                <div className="auth-logo-wrap">
                    <img src={logo} className="auth-logo" alt="Logo UTH" />
                </div>

                <div className="library-title">
                    <h1>THƯ VIỆN</h1>
                    <h2>ĐIỆN TỬ UTH</h2>
                </div>

                <p>
                    Hệ thống mượn và quản lý sách trực tuyến dành cho sinh viên
                    và giảng viên UTH.
                </p>

                <div className="feature-list">
                    {FEATURES.map((f) => (
                        <div className="catalog-item" key={f.label}>
                            <span className="catalog-icon">{f.icon}</span>
                            <span className="catalog-label">{f.label}</span>
                            <span className="catalog-leader"></span>
                            <span className="catalog-value">{f.value}</span>
                        </div>
                    ))}
                </div>

                <div className="book-spines">
                    {SPINES.map((s, i) => (
                        <div
                            key={i}
                            className="spine"
                            style={{ height: `${s.h}px`, background: s.c }}
                        ></div>
                    ))}
                </div>
            </div>

            <div className="auth-right">

                <div className="auth-card">

                    <div className="card-stamp">
                        <span>THẺ THƯ VIỆN</span>
                        <span>UTH</span>
                    </div>

                    <div className="auth-card-eyebrow">
                        {showForgotPassword ? "Khôi phục truy cập" : "Cổng truy cập"}
                    </div>

                    {showForgotPassword ? (
                        <>
                            <h2>Quên mật khẩu</h2>

                            {resetSent ? (
                                <>
                                    <p className="auth-footnote" style={{ marginBottom: 22 }}>
                                        Đã gửi liên kết đặt lại mật khẩu tới <b>{resetEmail}</b>.
                                        Vui lòng kiểm tra hộp thư (kể cả mục spam) để tiếp tục.
                                    </p>
                                    <button
                                        className="auth-btn"
                                        onClick={closeForgotPassword}
                                    >
                                        Quay lại đăng nhập
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="auth-footnote" style={{ marginBottom: 22 }}>
                                        Nhập email đã đăng ký, chúng tôi sẽ gửi cho bạn liên kết
                                        để đặt lại mật khẩu.
                                    </p>

                                    <div className="field-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            placeholder="ban@sv.uth.edu.vn"
                                            value={resetEmail}
                                            onChange={(e) =>
                                                setResetEmail(e.target.value)
                                            }
                                        />
                                    </div>

                                    <button
                                        className="auth-btn"
                                        onClick={handleForgotPassword}
                                        disabled={resetLoading}
                                    >
                                        {resetLoading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
                                    </button>

                                    <p className="auth-footnote">
                                        <button
                                            type="button"
                                            className="forgot-password-link"
                                            onClick={closeForgotPassword}
                                        >
                                            ← Quay lại đăng nhập
                                        </button>
                                    </p>
                                </>
                            )}
                        </>
                    ) : (
                    <>
                    <h2>
                        {isLogin ? "Chào bạn trở lại" : "Tạo thẻ thư viện"}
                    </h2>

                    <div className="auth-tabs">
                        <button
                            className={`auth-tab ${isLogin ? "active-tab-auth" : ""}`}
                            onClick={() => setIsLogin(true)}
                        >
                            Đăng nhập
                        </button>
                        <button
                            className={`auth-tab ${!isLogin ? "active-tab-auth" : ""}`}
                            onClick={() => setIsLogin(false)}
                        >
                            Đăng ký
                        </button>
                    </div>

                    {
                        !isLogin &&
                        <>
                            <div className="field-group">
                                <label>Họ và tên</label>
                                <input
                                    placeholder="Nguyễn Văn A"
                                    value={fullname}
                                    onChange={(e) =>
                                        setFullname(e.target.value)
                                    }
                                />
                            </div>

                            <div className="field-group">
                                <label>Mã sinh viên</label>
                                <input
                                    placeholder="VD: 2151xxxxxx"
                                    value={studentId}
                                    onChange={(e) =>
                                        setStudentId(e.target.value)
                                    }
                                />
                            </div>

                            <div className="field-group">
                                <label>Số điện thoại</label>
                                <input
                                    placeholder="09xx xxx xxx"
                                    value={phone}
                                    onChange={(e) =>
                                        setPhone(e.target.value)
                                    }
                                />
                            </div>
                        </>
                    }

                    <div className="field-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="ban@sv.uth.edu.vn"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                        />
                    </div>

                    <div className="field-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                        />
                    </div>

                    {
                        isLogin &&
                        <div className="forgot-password-row">
                            <button
                                type="button"
                                className="forgot-password-link"
                                onClick={openForgotPassword}
                            >
                                Quên mật khẩu?
                            </button>
                        </div>
                    }

                    {
                        !isLogin &&
                        <div className="field-group">
                            <label>Nhập lại mật khẩu</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                            />
                        </div>
                    }

                    <button
                        className="auth-btn"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {
                            loading
                                ? "Đang xử lý..."
                                : isLogin
                                    ? "Đăng nhập"
                                    : "Đăng ký"
                        }
                    </button>

                    <p className="auth-footnote">
                        {
                            isLogin
                                ? "Chưa có tài khoản? Chọn “Đăng ký” ở trên."
                                : "Đã có tài khoản? Chọn “Đăng nhập” ở trên."
                        }
                    </p>
                    </>
                    )}

                </div>

            </div>

        </div>

    );

}