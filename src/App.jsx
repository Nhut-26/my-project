import { useState, useEffect } from 'react';
import { Search, BookOpen, ChevronDown } from 'lucide-react';
import uthLogo from './assets/logo.png';
import './App.css'; 
import { supabase } from './lib/supabase.js';
import Auth from "./Auth";
import Profile from "./Profile";




export default function App() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDocumentMenu, setShowDocumentMenu] = useState(false);
  const [documentType, setDocumentType] = useState("all");
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [borrowDate, setBorrowDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfBook, setPdfBook] = useState(null);

  async function loadData() {
    const { data: categoryData, error: categoryError } =
      await supabase
        .from('categories')
        .select('*')
        .order('name');

    if (categoryError) {
      console.error(categoryError);
      return;
    }

    setCategories(categoryData);

    if (categoryData.length > 0) {
      setSelectedCategory(categoryData[0].name);
    }

    const { data: bookData, error: bookError } =
      await supabase
        .from('books')
        .select(`
          *,
          categories(name)
        `);

    if (bookError) {
      console.error(bookError);
      return;
    }

    setBooks(bookData);
  };

  useEffect(() => {
    (async () => {
      await loadData();
    })();
  }, []);

  // Single source of truth for auth state + profile (removed the duplicate
  // getUser effect that used to run alongside this one).
  useEffect(() => {
    async function getUser() {

        const {
            data: { user }
        } = await supabase.auth.getUser();

        setUser(user);

        if (user) {

            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            setProfile(data);
        }

    }

    getUser();

    const {
        data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {

        const currentUser = session?.user ?? null;

        setUser(currentUser);

        if (currentUser) {

            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", currentUser.id)
                .single();

            setProfile(data);

        } else {

            setProfile(null);

        }

    });

    return () => subscription.unsubscribe();

  }, []);

  // Handles both ebooks (opens reader) and physical books (opens the
  // borrow invoice modal), with the login/availability checks that used
  // to be skipped for physical books.
  const handleBorrow = async (id) => {
    if (!user) {

        alert("Bạn cần đăng nhập.");

        return;

    }
    const book = books.find(
      b => b.id === id
    );

    if (!book) return;

    if (book.type === 'ebook') {
      if (!book.pdf_url) {
        alert("Sách này chưa có file PDF.");
        return;
      }

      // Ghi lại lượt đọc ebook vào bảng invoices để hiển thị trong
      // "Sách đã mượn" ở trang hồ sơ (ebook không cần trả nên
      // borrow_date và return_date lấy cùng ngày hôm đó).
      const today = new Date().toISOString().split('T')[0];

      const { error: invoiceError } = await supabase.from("invoices").insert([
        {
          book_id: book.id,
          user_id: user.id,
          borrow_date: today,
          return_date: today,
          status: "completed",
        },
      ]);

      if (invoiceError) {
        console.error(invoiceError);
      }

      setPdfBook(book);
      setShowPdfViewer(true);
      return;
    }

    setSelectedBook(book);
    setBorrowDate(new Date().toISOString().split('T')[0]);
    setShowInvoice(true);
  }

  async function handleLogout() {
                
      const { error } = await supabase.auth.signOut();

      if (error) {
          alert(error.message);
          return;
      }

      setUser(null);
      setProfile(null);

  }            


  const filteredBooks = books.filter(book => {
    const matchesCategory = book.categories?.name === selectedCategory;

    const matchesSearch =
      book.title.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesType =
      documentType === "all"
        ? true
        : book.type === documentType;

    return (
        matchesCategory &&
        matchesSearch &&
        matchesType
    );
  });

  const handleSubmitInvoice = async () => {
    if (!borrowDate) {
      alert("Vui lòng chọn ngày nhận sách");
      return;
    }

    if (!returnDate) {
      alert("Vui lòng chọn ngày trả");
      return;
    }

    if (returnDate < borrowDate) {
      alert("Ngày trả không được trước ngày nhận sách");
      return;
    }

    const { error: invoiceError } = await supabase.from("invoices").insert([
      {
        book_id: selectedBook.id,
        user_id: user.id,
        borrow_date: borrowDate,
        return_date: returnDate,
        status: "borrowed",
      },
    ]);

    if (invoiceError) {
      alert("Lỗi: " + invoiceError.message);
      return;
    }

    // Mượn sách chỉ trừ số lượng còn lại, KHÔNG đổi status trực tiếp.
    // status của books chỉ chuyển sang "unavailable" khi quantity về 0.
    const newQuantity = Math.max((selectedBook.quantity ?? 1) - 1, 0);
    const bookUpdatePayload =
      newQuantity === 0
        ? { quantity: newQuantity, status: "unavailable" }
        : { quantity: newQuantity };

    const { error: statusError } = await supabase
      .from("books")
      .update(bookUpdatePayload)
      .eq("id", selectedBook.id);

    if (statusError) {
      console.error(statusError);
    } else {
      setBooks(prev =>
        prev.map(book =>
          book.id === selectedBook.id
            ? { ...book, ...bookUpdatePayload }
            : book
        )
      );
    }

    alert("Mượn sách thành công!");
    setShowInvoice(false);
    setBorrowDate("");
    setReturnDate("");
    setSelectedBook(null);
  };

  if (!user) {

      return <Auth />;

  }

  if (showProfilePage) {

      return (
          <Profile
              user={user}
              profile={profile}
              onBack={() => setShowProfilePage(false)}
              onLogout={handleLogout}
              onProfileUpdated={setProfile}
          />
      );

  }

  return (
    <div className="wrapper">
      <div className="top-accent-bar"></div>

      <div className="app-container">
        {/* HEADER */}
        <header className="header">
          <div className="logo">
            <img src={uthLogo} alt="Logo UTH" className="logo-img" />
            <div className="divider"></div>
            <span className="logo-text">Thư Viện Điện Tử</span>
          </div>

          <nav className="nav-menu">
            <div className="document-menu">
              <button onClick={() => setShowDocumentMenu(!showDocumentMenu)}>
                  Tài liệu
                  <ChevronDown size={14} className="inline-icon" />
              </button>
              {showDocumentMenu && (
                  <div className="dropdown-menu">
                      <button
                          onClick={()=>{
                              setDocumentType("all");
                              setShowDocumentMenu(false);
                          }}
                      >
                          Tất cả
                      </button>

                      <button
                          onClick={()=>{
                              setDocumentType("physical");
                              setShowDocumentMenu(false);
                          }}
                      >
                          Sách giấy
                      </button>

                      <button
                          onClick={()=>{
                              setDocumentType("ebook");
                              setShowDocumentMenu(false);
                          }}
                      >
                          Ebook
                      </button>

                  </div>
              )}
          </div>
            <button>Hướng dẫn</button>

            <button className="teal-square-btn">
              <BookOpen size={16} />
            </button>

            <div className="user-profile">

                <div className="profile-menu">
                  <div className="avatar-circle" onClick={() => setShowMenu(!showMenu)}>
                      {(profile?.full_name || user.email || "?").charAt(0).toUpperCase()}
                  </div>

                  {showMenu && (
                    <div className="dropdown">
                      <button onClick={() => { setShowMenu(false); setShowProfilePage(true); }}>
                        Hồ sơ
                      </button>
                      <button onClick={() => { setShowMenu(false); handleLogout(); }}>
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>

                <div className="user-info">

                    <span className="user-name">
                        {profile?.full_name || user.email}
                    </span>

                    <small>
                        {profile?.student_id}
                    </small>

                </div>

            </div>
          </nav>
        </header>

        <div className="search-section">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Bạn muốn tìm tài liệu gì?" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="search-icon" size={18} />
          </div>
        </div>

        {/* BANNER */}
        <div className="banner">
          <div className="dot dot-1"></div>
          <div className="dot dot-2"></div>
          <div className="dot dot-3"></div>

          <h1>Thư viện điện tử UTH</h1>
          
        </div>

        {/* CATEGORY TABS */}
        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={
                selectedCategory === cat.name
                  ? 'active-tab'
                  : ''
              }
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* BOOK GRID */}
        <main className="main-content">
          <h2>Chuyên mục: {selectedCategory}</h2>
          
          <div className="book-grid">
            {filteredBooks.map(book => (
              <div key={book.id} className="book-card">
                <div className="book-cover">
                  <img src={book.cover} alt={book.title} />
                  <span className={`badge ${book.type === 'ebook' ? 'badge-ebook' : 'badge-physical'}`}>
                    {book.type === 'ebook' ? 'Ebook' : 'Sách giấy'}
                  </span>
                </div>
                <div className="book-info">
                  <h3 title={book.title}>
                    {book.title}
                  </h3>
                  <p className="author">Tác giả: {book.author}</p>
                  
                  <div className="action-buttons">
                    {book.type === 'ebook' ? (
                      <button onClick={() => handleBorrow(book.id)} className="btn-read">
                        <BookOpen size={14} className="inline-icon" /> Đọc trực tuyến
                      </button>
                    ) : book.status === 'available' ? (
                     <button
                        onClick={() => handleBorrow(book.id)}
                        className="btn-borrow"
                      >
                        Mượn
                      </button>
                    ) : (
                      <div className="borrowed-status">
                        <span className="status-badge">Đã hết sách</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
      {showInvoice && (
        <div className="modal">
          <div className="modal-content">
            <h3>Hóa đơn mượn sách</h3>

            <p><b>Sách:</b> {selectedBook?.title}</p>
            <p><b>Người mượn:</b> {user?.email}</p>

            <label>Ngày nhận sách:</label>
            <input
              type="date"
              value={borrowDate}
              onChange={(e) => setBorrowDate(e.target.value)}
            />

            <label>Ngày trả:</label>
            <input
              type="date"
              min={borrowDate || undefined}
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />

            <div className="invoice-policy-note">
              <b>Lưu ý quy định mượn sách:</b> Nếu quá hạn trả sách 1 ngày sẽ
              phải thanh toán 50.000đ phí phạt, nếu không thanh toán sau 12
              ngày sẽ phải thanh toán 100.000đ phí phạt. Còn nếu sau 30 ngày
              không trả sách, hệ thống sẽ đóng tài khoản đến khi người dùng
              trả sách và thanh toán 100.000đ phí phạt!
            </div>

            <button className="btn-confirm" onClick={handleSubmitInvoice}>Xác nhận</button>
            <button className="btn-cancel" onClick={() => setShowInvoice(false)}>Hủy</button>
          </div>
        </div>
      )}

      {showPdfViewer && pdfBook && (
        <div className="modal">
          <div className="modal-content modal-content-pdf">
            <h3 title={pdfBook.title}>{pdfBook.title}</h3>

            <div className="pdf-preview">
              <iframe
                src={pdfBook.pdf_url}
                title={pdfBook.title}
                width="100%"
                height="500px"
              />
            </div>

            <div className="pdf-actions">
              <a
                href={pdfBook.pdf_url}
                download={`${pdfBook.title}.pdf`}
                target="_blank"
                rel="noreferrer"
                className="btn-confirm"
              >
                Tải về
              </a>
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowPdfViewer(false);
                  setPdfBook(null);
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
  ;
}