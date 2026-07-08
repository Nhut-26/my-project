import { useState, useEffect } from 'react';
import { Search, User, BookOpen, Book, RotateCcw, ChevronDown } from 'lucide-react';
import uthLogo from './assets/logo.png';
import './App.css'; 
import { supabase } from './lib/supabase.js';
import Auth from "./Auth";




export default function App() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDocumentMenu, setShowDocumentMenu] = useState(false);
  const [documentType, setDocumentType] = useState("all");
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('all');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

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
        alert(`Đã mở Ebook "${book.title}"`);
        return;
      }

      const { error } = await supabase
        .from('books')
        .update({
          status: 'borrowed'
        })
        .eq('id', id);

      if (error) {
        console.error(error);
        return;
      }
      if (book.status === "borrowed") {
          alert("Sách hiện đã hết hàng.");
          return;
      }

      setBooks(prev =>
          prev.map(book =>
              book.id === id
                  ? { ...book, status: "borrowed" }
                  : book
          )
      );}

    const handleReturn = async (id) => {
      const { error } = await supabase
        .from('books')
        .update({
          status: 'available'
        })
        .eq('id', id);

      if (error) {
        console.error(error);
        return;
      }

      setBooks(prev =>
        prev.map(book =>
            book.id === id
                ? { ...book, status: "borrowed" }
                : book
        )
      );

      alert('📥 Trả sách thành công!');
    };
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
      const matchesCategory =
        viewMode === 'borrowed'
          ? true
          : book.categories?.name === selectedCategory;

      const matchesSearch =
        book.title.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesBorrowedView =
        viewMode === 'borrowed'
          ? book.status === 'borrowed'
          : true;
        const matchesType =
          documentType === "all"
            ? true
            : book.type === documentType;

      return (
          matchesCategory &&
          matchesSearch &&
          matchesBorrowedView &&
          matchesType
      );
    });
  if (!user) {

      return <Auth />;

  }

  return (
    <div className="wrapper">
      <div className="top-accent-bar"></div>

      <div className="app-container">
        {/* HEADER */}
        <header className="header">
          <div className="logo" onClick={() => setViewMode('all')}>
            <img src={uthLogo} alt="Logo UTH" className="logo-img" />
            <div className="divider"></div>
            <span className="logo-text">Thư Viện Điện Tử</span>
          </div>

          <nav className="nav-menu">
            <div className="document-menu">
              <button
                  onClick={() => setShowDocumentMenu(!showDocumentMenu)}
                  className={viewMode === "all" ? "active-nav" : ""}
              >
                  Tài liệu
                  <ChevronDown size={14} className="inline-icon" />
              </button>
              {showDocumentMenu && (
                  <div className="dropdown-menu">
                      <button
                          onClick={()=>{
                              setDocumentType("all");
                              setViewMode("all");
                              setShowDocumentMenu(false);
                          }}
                      >
                          Tất cả
                      </button>

                      <button
                          onClick={()=>{
                              setDocumentType("physical");
                              setViewMode("all");
                              setShowDocumentMenu(false);
                          }}
                      >
                          Sách giấy
                      </button>

                      <button
                          onClick={()=>{
                              setDocumentType("ebook");
                              setViewMode("all");
                              setShowDocumentMenu(false);
                          }}
                      >
                          Ebook
                      </button>

                  </div>
              )}
          </div>
            <button>Hướng dẫn</button>
            <button onClick={() => setViewMode('borrowed')} className={viewMode === 'borrowed' ? 'active-nav' : ''}>
              Sách đã mượn
            </button>
            
            <button className="teal-square-btn">
              <BookOpen size={16} />
            </button>

            <div className="user-profile">

                <div className="avatar-circle">
                    <User size={16} />
                </div>

                <div className="user-info">

                    <span className="user-name">
                        {profile?.fullname || user.email}
                    </span>

                    <small>
                        {profile?.student_id}
                    </small>

                </div>

                <button
                    className="logout-btn"
                    onClick={handleLogout}
                >
                    Đăng xuất
                </button>

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

          <h1>{viewMode === 'all' ? 'Thư viện điện tử UTH' : 'Tủ sách cá nhân'}</h1>
          
        </div>

        {/* CATEGORY TABS */}
        {viewMode === 'all' && (
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
        )}

        {/* BOOK GRID */}
        <main className="main-content">
          <h2>{viewMode === 'all' ? `Chuyên mục: ${selectedCategory}` : '📚 Danh sách sách đang giữ'}</h2>
          
          <div className="book-grid">
            {filteredBooks.map(books => (
              <div key={books.id} className="book-card">
                <div className="book-cover">
                  <img src={books.cover} alt={books.title} />
                  <span className={`badge ${books.type === 'ebook' ? 'badge-ebook' : 'badge-physical'}`}>
                    {books.type === 'ebook' ? 'Ebook' : 'Sách giấy'}
                  </span>
                </div>
                <div className="book-info">
                  <h3 title={books.title}>
                    {books.title}
                  </h3>
                  <p className="author">Tác giả: {books.author}</p>
                  
                  <div className="action-buttons">
                    {books.type === 'ebook' ? (
                      <button onClick={() => handleBorrow(books.id)} className="btn-read">
                        <BookOpen size={14} className="inline-icon" /> Đọc trực tuyến
                      </button>
                    ) : books.status === 'available' ? (
                      <button onClick={() => handleBorrow(books.id)} className="btn-borrow">
                        <Book size={14} className="inline-icon" /> Mượn sách giấy
                      </button>
                    ) : (
                      <div className="borrowed-status">
                        <span className="status-badge">Đã hết sách</span>
                        {viewMode === 'borrowed' && (
                          <button onClick={() => handleReturn(books.id)} className="btn-return">
                            <RotateCcw size={12} /> Hoàn trả sách
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}