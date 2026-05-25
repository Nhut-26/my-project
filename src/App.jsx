import  { useState } from 'react';
import { Search, User, BookOpen, Book, RotateCcw, ChevronDown } from 'lucide-react';
import uthLogo from './assets/logo.png';
import './App.css'; 

const INITIAL_BOOKS = [
  { id: 1, title: 'Tư Duy Nhanh Và Chậm', category: 'Kiến thức - Học thuật', type: 'physical', status: 'available', author: 'Daniel Kahneman', cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400' },
  { id: 2, title: 'Bí Quyết Trắng Tay Thành Triệu Phú', category: 'Kiến thức - Học thuật', type: 'ebook', status: 'available', author: 'Carmine Gallo', cover: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400' },
  { id: 3, title: 'Vũ Trụ Trong Vỏ Hạt Dẻ', category: 'Khoa học viễn tưởng', type: 'physical', status: 'borrowed', author: 'Stephen Hawking', cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400' },
  { id: 4, title: 'Hành Trình Về Phương Đông', category: 'Phiêu lưu', type: 'ebook', status: 'available', author: 'Baird T. Spalding', cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400' },
];

const CATEGORIES = ['Khoa học viễn tưởng', 'Kiến thức - Học thuật', 'Phiêu lưu', 'Tâm Lý – Kỹ Năng Sống'];

export default function App() {
  const [books, setBooks] = useState(INITIAL_BOOKS);
  const [selectedCategory, setSelectedCategory] = useState('Kiến thức - Học thuật');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('all');

  const handleBorrow = (id) => {
    setBooks(prev => prev.map(book => {
      if (book.id === id) {
        if (book.type === 'ebook') {
          alert(`🎉 Đã mở Ebook "${book.title}"!`);
          return book;
        } else {
          return { ...book, status: 'borrowed' };
        }
      }
      return book;
    }));
  };

  const handleReturn = (id) => {
    setBooks(prev => prev.map(book => book.id === id ? { ...book, status: 'available' } : book));
    alert('📥 Trả sách thành công!');
  };

  const filteredBooks = books.filter(book => {
    const matchesCategory = viewMode === 'borrowed' ? true : book.category === selectedCategory;
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBorrowedView = viewMode === 'borrowed' ? book.status === 'borrowed' : true;
    return matchesCategory && matchesSearch && matchesBorrowedView;
  });

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
            <button onClick={() => setViewMode('all')} className={viewMode === 'all' ? 'active-nav' : ''}>
              Tài liệu <ChevronDown size={14} className="inline-icon" />
            </button>
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
              <span>Mnhut</span>
              <ChevronDown size={14} />
            </div>
          </nav>
        </header>

        {/* SEARCH BAR */}
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
            {CATEGORIES.map(cat => (
              <button 
                key={cat} 
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? 'active-tab' : ''}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* BOOK GRID */}
        <main className="main-content">
          <h2>{viewMode === 'all' ? `Chuyên mục: ${selectedCategory}` : '📚 Danh sách sách đang giữ'}</h2>
          
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
                  <h3>{book.title}</h3>
                  <p className="author">Tác giả: {book.author}</p>
                  
                  <div className="action-buttons">
                    {book.type === 'ebook' ? (
                      <button onClick={() => handleBorrow(book.id)} className="btn-read">
                        <BookOpen size={14} className="inline-icon" /> Đọc trực tuyến
                      </button>
                    ) : book.status === 'available' ? (
                      <button onClick={() => handleBorrow(book.id)} className="btn-borrow">
                        <Book size={14} className="inline-icon" /> Mượn sách giấy
                      </button>
                    ) : (
                      <div className="borrowed-status">
                        <span className="status-badge">Đã hết sách</span>
                        {viewMode === 'borrowed' && (
                          <button onClick={() => handleReturn(book.id)} className="btn-return">
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