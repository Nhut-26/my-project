import { useState, useEffect } from "react";
import { ArrowLeft, LogOut, User, Pencil, BookOpen, RotateCcw } from "lucide-react";
import { supabase } from "./lib/supabase.js";
import "./App.css";

const SECTIONS = [
  { id: "view", label: "Xem thông tin", icon: User },
  { id: "edit", label: "Chỉnh sửa thông tin", icon: Pencil },
  { id: "borrowed", label: "Sách đã mượn", icon: BookOpen },
];

export default function Profile({ user, profile, onBack, onLogout, onProfileUpdated }) {
  const [activeSection, setActiveSection] = useState("view");
  const displayName = profile?.full_name || user?.email || "?";

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <div className="profile-topbar">
          <div className="profile-topbar-title">
            <span className="profile-eyebrow">Thẻ Thư Viện · UTH</span>
            <h1>Hồ sơ của tôi</h1>
          </div>
          <button className="profile-back-btn" onClick={onBack}>
            <ArrowLeft size={14} /> Quay lại
          </button>
        </div>

        <div className="profile-body">
          {/* CỘT TRÁI: ảnh thẻ + mục lục */}
          <aside className="profile-sidebar">
            <div className="profile-avatar-frame">
              <div className="profile-avatar-large">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="profile-name">{displayName}</div>
            <div className="profile-role">Sinh viên</div>

            <button
              className="profile-edit-avatar-btn"
              onClick={() =>
                alert("Tính năng đổi ảnh đại diện sẽ sớm ra mắt.")
              }
            >
              Đổi ảnh đại diện
            </button>

            <nav className="profile-section-nav">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    className={`profile-section-item ${
                      activeSection === section.id ? "active-section" : ""
                    }`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Icon size={13} /> {section.label}
                  </button>
                );
              })}

              <button
                className="profile-section-item danger-section"
                onClick={onLogout}
              >
                <LogOut size={13} /> Đăng xuất
              </button>
            </nav>
          </aside>

          {/* CỘT PHẢI: nội dung của section đang chọn */}
          <section className="profile-content">
            {activeSection === "view" && (
              <ViewInfo user={user} profile={profile} />
            )}

            {activeSection === "edit" && (
              <EditInfo
                user={user}
                profile={profile}
                onProfileUpdated={onProfileUpdated}
                onSaved={() => setActiveSection("view")}
              />
            )}

            {activeSection === "borrowed" && (
              <BorrowedBooks user={user} profile={profile} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Xem thông tin
   ============================================================ */
function ViewInfo({ user, profile }) {
  return (
    <>
      <span className="profile-content-eyebrow">Mục 01</span>
      <h2>Xem thông tin</h2>
      <p className="profile-content-subtitle">Thông tin thẻ thư viện của bạn.</p>

      <div className="profile-info-list">
        <div className="profile-info-row">
          <span className="profile-info-label">Họ và tên</span>
          <span className="profile-info-value">{profile?.full_name || "—"}</span>
        </div>

        <div className="profile-info-row">
          <span className="profile-info-label">Mã sinh viên</span>
          <span className="profile-info-value">{profile?.student_id || "—"}</span>
        </div>

        <div className="profile-info-row">
          <span className="profile-info-label">Email</span>
          <span className="profile-info-value">
            {profile?.email || user?.email || "—"}
          </span>
        </div>

        <div className="profile-info-row">
          <span className="profile-info-label">Số điện thoại</span>
          <span className="profile-info-value">{profile?.phone || "—"}</span>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   Chỉnh sửa thông tin — lưu thật vào bảng profiles
   ============================================================ */
function EditInfo({ user, profile, onProfileUpdated, onSaved }) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [studentId, setStudentId] = useState(profile?.student_id || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleSave(e) {
    e.preventDefault();

    if (!fullName.trim() || !studentId.trim() || !phone.trim()) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        student_id: studentId.trim(),
        phone: phone.trim(),
      })
      .eq("id", user.id)
      .select()
      .single();

    setSaving(false);

    if (error) {
      alert("Lỗi cập nhật thông tin: " + error.message);
      return;
    }

    onProfileUpdated?.(data);
    alert("Cập nhật thông tin thành công!");
    onSaved?.();
  }

  async function handleChangePassword(e) {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      alert("Vui lòng nhập đầy đủ thông tin mật khẩu.");
      return;
    }

    if (newPassword.length < 6) {
      alert("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert("Mật khẩu mới không khớp.");
      return;
    }

    setChangingPassword(true);

    // Xác thực lại mật khẩu hiện tại trước khi đổi, để tránh việc
    // đổi mật khẩu khi phiên đăng nhập bị chiếm dụng.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (reauthError) {
      setChangingPassword(false);
      alert("Mật khẩu hiện tại không đúng.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setChangingPassword(false);

    if (updateError) {
      alert("Lỗi đổi mật khẩu: " + updateError.message);
      return;
    }

    alert("Đổi mật khẩu thành công!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  }

  return (
    <>
      <span className="profile-content-eyebrow">Mục 02</span>
      <h2>Chỉnh sửa thông tin</h2>
      <p className="profile-content-subtitle">
        Cập nhật thông tin thẻ thư viện của bạn.
      </p>

      <form className="profile-edit-form" onSubmit={handleSave}>
        <div className="field-group">
          <label>Họ và tên</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Văn A"
          />
        </div>

        <div className="field-group">
          <label>Mã sinh viên</label>
          <input
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="VD: 2151xxxxxx"
          />
        </div>

        <div className="field-group">
          <label>Số điện thoại</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09xx xxx xxx"
          />
        </div>

        <div className="field-group">
          <label>Email</label>
          <input value={profile?.email || user?.email || ""} disabled />
          <span className="field-hint">Email không thể thay đổi.</span>
        </div>

        <button className="auth-btn" type="submit" disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>

      <hr className="profile-section-divider" />

      <span className="profile-content-eyebrow">Mật khẩu</span>
      <h2>Đổi mật khẩu</h2>
      <p className="profile-content-subtitle">
        Đổi mật khẩu đăng nhập cho tài khoản của bạn.
      </p>

      <form className="profile-edit-form" onSubmit={handleChangePassword}>
        <div className="field-group">
          <label>Mật khẩu hiện tại</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="field-group">
          <label>Mật khẩu mới</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="field-group">
          <label>Nhập lại mật khẩu mới</label>
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button className="auth-btn" type="submit" disabled={changingPassword}>
          {changingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
        </button>
      </form>
    </>
  );
}

/* ============================================================
   Tính toán quá hạn + phí phạt dựa trên quy định thư viện:
   - Quá hạn 1 ngày: phạt 50.000đ
   - Không thanh toán sau 12 ngày kể từ ngày hết hạn: phạt tăng
     lên 100.000đ
   - Sau 30 ngày không trả sách: tài khoản có thể bị khóa, vẫn
     phải trả sách + thanh toán 100.000đ
   Chỉ áp dụng cho sách giấy đang trong trạng thái "borrowed"
   (ebook không có hạn trả).
   ============================================================ */
function getOverdueInfo(invoice) {
  if (!invoice.books || invoice.books.type === "ebook") return null;
  if (invoice.status !== "borrowed") return null;
  if (!invoice.return_date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(invoice.return_date);
  dueDate.setHours(0, 0, 0, 0);

  const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

  if (daysOverdue <= 0) {
    return { overdue: false, daysOverdue: 0, fine: 0, locked: false, tier: null };
  }

  const locked = daysOverdue >= 30;
  const fine = daysOverdue >= 12 ? 100000 : 50000;
  const tier =
    daysOverdue >= 30
      ? "Quá hạn trên 30 ngày"
      : daysOverdue >= 12
      ? "Quá hạn trên 12 ngày chưa thanh toán"
      : "Quá hạn trả sách";

  return { overdue: true, daysOverdue, fine, locked, tier };
}

function formatVND(amount) {
  return amount.toLocaleString("vi-VN") + "đ";
}

/* ============================================================
   Sách đã mượn — lấy từ bảng invoices
   ============================================================ */
function BorrowedBooks({ user, profile }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [returningId, setReturningId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);

  useEffect(() => {
    let ignore = false;

    (async () => {
      // Lấy invoices trước, KHÔNG join trực tiếp với bảng books qua cú pháp
      // "books(...)" của PostgREST — nếu Supabase không tự nhận diện được
      // quan hệ khóa ngoại (hoặc bị RLS chặn), câu query đó sẽ lỗi âm thầm
      // (chỉ console.error) và danh sách sẽ luôn trống. Tách làm 2 bước để
      // luôn kiểm soát được và không phụ thuộc vào việc suy luận quan hệ.
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .order("borrow_date", { ascending: false });

      if (ignore) return;

      if (invoiceError) {
        console.error(invoiceError);
        setLoadError(invoiceError.message);
        setLoading(false);
        return;
      }

      if (!invoiceData || invoiceData.length === 0) {
        setInvoices([]);
        setLoading(false);
        return;
      }

      const bookIds = [...new Set(invoiceData.map((inv) => inv.book_id))];

      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .select("id, title, author, cover, type, status, quantity")
        .in("id", bookIds);

      if (ignore) return;

      if (bookError) {
        console.error(bookError);
        setLoadError(bookError.message);
        setLoading(false);
        return;
      }

      const bookMap = new Map((bookData || []).map((b) => [b.id, b]));

      const merged = invoiceData.map((inv) => ({
        ...inv,
        books: bookMap.get(inv.book_id) || null,
      }));

      setInvoices(merged);
      setLoading(false);
    })();

    return () => {
      ignore = true;
    };
  }, [user.id]);

  async function handleReturn(invoice) {
    if (!invoice.books) return;

    setReturningId(invoice.id);

    // Trạng thái "đã trả" được lưu trên chính hóa đơn, không suy ra
    // từ status của sách.
    const { error: invoiceUpdateError } = await supabase
      .from("invoices")
      .update({ status: "returned" })
      .eq("id", invoice.id);

    if (invoiceUpdateError) {
      setReturningId(null);
      alert("Lỗi khi trả sách: " + invoiceUpdateError.message);
      return;
    }

    // Trả sách chỉ cộng lại số lượng còn lại. status của books chỉ đổi
    // về "available" khi quantity tăng trở lại > 0.
    const newQuantity = (invoice.books.quantity ?? 0) + 1;

    const { error: bookUpdateError } = await supabase
      .from("books")
      .update({ quantity: newQuantity, status: "available" })
      .eq("id", invoice.book_id);

    setReturningId(null);

    if (bookUpdateError) {
      console.error(bookUpdateError);
    }

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoice.id
          ? {
              ...inv,
              status: "returned",
              books: { ...inv.books, quantity: newQuantity, status: "available" },
            }
          : inv
      )
    );

    alert("📥 Trả sách thành công!");
  }

  async function handlePayFine(invoice) {
    setPayingId(invoice.id);

    const { error } = await supabase
      .from("invoices")
      .update({ fine_paid: true })
      .eq("id", invoice.id);

    setPayingId(null);

    if (error) {
      alert("Lỗi khi thanh toán phí phạt: " + error.message);
      return;
    }

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoice.id ? { ...inv, fine_paid: true } : inv
      )
    );

    setViewingInvoice((prev) =>
      prev && prev.id === invoice.id ? { ...prev, fine_paid: true } : prev
    );

    alert("💳 Thanh toán phí phạt thành công!");
  }

  return (
    <>
      <span className="profile-content-eyebrow">Mục 03</span>
      <h2>Sách đã mượn</h2>
      <p className="profile-content-subtitle">
        Danh sách các lượt mượn sách của bạn.
      </p>

      {loading && <p className="profile-content-subtitle">Đang tải...</p>}

      {!loading && loadError && (
        <div className="profile-empty-state">
          Không thể tải danh sách sách đã mượn: {loadError}
        </div>
      )}

      {!loading && !loadError && invoices.length === 0 && (
        <div className="profile-empty-state">Bạn chưa mượn quyển sách nào.</div>
      )}

      {!loading && !loadError && invoices.length > 0 && (
        <div className="profile-borrowed-list">
          {invoices.map((inv) => {
            const overdueInfo = getOverdueInfo(inv);

            return (
              <div key={inv.id} className="profile-borrowed-item">
                <div className="profile-borrowed-cover">
                  {inv.books?.cover ? (
                    <img src={inv.books.cover} alt={inv.books.title} />
                  ) : (
                    <BookOpen size={18} />
                  )}
                </div>

                <div className="profile-borrowed-meta">
                  <h4>{inv.books?.title || "Sách không xác định"}</h4>
                  <p>Tác giả: {inv.books?.author || "—"}</p>

                  {overdueInfo?.overdue && (
                    <span
                      className={`overdue-badge ${
                        inv.fine_paid ? "overdue-badge-paid" : ""
                      }`}
                    >
                      Quá hạn {overdueInfo.daysOverdue} ngày ·{" "}
                      {inv.fine_paid
                        ? `Đã thanh toán ${formatVND(overdueInfo.fine)}`
                        : `Phạt ${formatVND(overdueInfo.fine)}`}
                    </span>
                  )}
                </div>

                <div className="profile-borrowed-dates">
                  <span>
                    NHẬN:{" "}
                    {inv.borrow_date
                      ? new Date(inv.borrow_date).toLocaleDateString("vi-VN")
                      : "—"}
                  </span>
                  <span>
                    TRẢ DK:{" "}
                    {inv.return_date
                      ? new Date(inv.return_date).toLocaleDateString("vi-VN")
                      : "—"}
                  </span>
                </div>

                <div className="profile-borrowed-actions">
                  <button
                    className="btn-invoice"
                    onClick={() => setViewingInvoice(inv)}
                  >
                    Xem hóa đơn
                  </button>

                  {inv.books?.type !== "ebook" &&
                    inv.status === "borrowed" && (
                      <button
                        className="btn-return"
                        onClick={() => handleReturn(inv)}
                        disabled={returningId === inv.id}
                      >
                        <RotateCcw size={12} />{" "}
                        {returningId === inv.id
                          ? "Đang xử lý..."
                          : "Hoàn trả sách"}
                      </button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewingInvoice && (
        <InvoiceModal
          invoice={viewingInvoice}
          user={user}
          profile={profile}
          onClose={() => setViewingInvoice(null)}
          onPayFine={handlePayFine}
          paying={payingId === viewingInvoice.id}
        />
      )}
    </>
  );
}

/* ============================================================
   Modal xem chi tiết hóa đơn mượn sách + thanh toán phí phạt
   ============================================================ */
function InvoiceModal({ invoice, user, profile, onClose, onPayFine, paying }) {
  const overdueInfo = getOverdueInfo(invoice);
  const displayName = profile?.full_name || user?.email || "—";

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Hóa đơn mượn sách</h3>

        <p>
          <b>Sách:</b> {invoice.books?.title || "Sách không xác định"}
        </p>
        <p>
          <b>Tác giả:</b> {invoice.books?.author || "—"}
        </p>
        <p>
          <b>Người mượn:</b> {displayName}
        </p>
        <p>
          <b>Email:</b> {user?.email}
        </p>
        <p>
          <b>Ngày nhận sách:</b>{" "}
          {invoice.borrow_date
            ? new Date(invoice.borrow_date).toLocaleDateString("vi-VN")
            : "—"}
        </p>
        <p>
          <b>Ngày trả dự kiến:</b>{" "}
          {invoice.return_date
            ? new Date(invoice.return_date).toLocaleDateString("vi-VN")
            : "—"}
        </p>
        <p>
          <b>Tình trạng:</b>{" "}
          {invoice.books?.type === "ebook"
            ? "Ebook (đã đọc trực tuyến)"
            : invoice.status === "borrowed"
            ? "Đang mượn"
            : "Đã trả"}
        </p>

        {overdueInfo?.overdue ? (
          <div className="invoice-policy-note invoice-fine-note">
            <b>{overdueInfo.tier}:</b> Quá hạn {overdueInfo.daysOverdue}{" "}
            ngày. Phí phạt hiện tại:{" "}
            <b>{formatVND(overdueInfo.fine)}</b>.
            {overdueInfo.locked && (
              <>
                {" "}
                Tài khoản có thể bị tạm khóa cho đến khi trả sách và thanh
                toán đầy đủ phí phạt.
              </>
            )}
            <br />
            Trạng thái thanh toán:{" "}
            <b>{invoice.fine_paid ? "Đã thanh toán" : "Chưa thanh toán"}</b>

            {!invoice.fine_paid && (
              <button
                className="btn-confirm invoice-pay-btn"
                onClick={() => onPayFine(invoice)}
                disabled={paying}
              >
                {paying ? "Đang xử lý..." : `Thanh toán ${formatVND(overdueInfo.fine)}`}
              </button>
            )}
          </div>
        ) : (
          <div className="invoice-policy-note">
            Nếu quá hạn trả sách 1 ngày sẽ phải thanh toán 50.000đ phí phạt,
            nếu không thanh toán sau 12 ngày sẽ phải thanh toán 100.000đ phí
            phạt. Còn nếu sau 30 ngày không trả sách, hệ thống sẽ đóng tài
            khoản đến khi người dùng trả sách và thanh toán 100.000đ phí
            phạt!
          </div>
        )}

        <button className="btn-cancel" onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  );
}