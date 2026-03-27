// board.js - 게시판 목록 (Supabase 연동)

const PAGE_SIZE = 10;
let currentPage = 1;
let currentKeyword = '';
let totalCount = 0;

document.addEventListener('DOMContentLoaded', () => {
  loadPosts();
  initSearch();
  initWriteBtn();
});

// ── 게시글 목록 로드 ──
async function loadPosts() {
  const tbody = document.getElementById('boardTbody');
  tbody.innerHTML = '<tr><td colspan="5" class="board__empty">불러오는 중...</td></tr>';

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = _supabase
    .from('posts')
    .select('id, title, author_name, created_at, views', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (currentKeyword) {
    query = query.ilike('title', `%${currentKeyword}%`);
  }

  const { data: posts, error, count } = await query;

  if (error) {
    tbody.innerHTML = '<tr><td colspan="5" class="board__empty">데이터를 불러오지 못했습니다.</td></tr>';
    return;
  }

  totalCount = count || 0;
  renderTable(posts);
  renderPagination();
}

// ── 테이블 렌더링 ──
function renderTable(posts) {
  const tbody = document.getElementById('boardTbody');
  tbody.innerHTML = '';

  if (!posts || !posts.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="board__empty">게시글이 없습니다.</td></tr>';
    return;
  }

  posts.forEach((post, idx) => {
    const num = totalCount - ((currentPage - 1) * PAGE_SIZE) - idx;
    const date = post.created_at.slice(0, 10);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${num}</td>
      <td class="board__col-title">
        <a href="post.html?id=${post.id}" class="board__post-link">${post.title}</a>
      </td>
      <td>${post.author_name}</td>
      <td>${date}</td>
      <td>${post.views}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ── 페이지네이션 렌더링 ──
function renderPagination() {
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const pageList = document.getElementById('pageList');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  pageList.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement('li');
    li.textContent = i;
    if (i === currentPage) li.classList.add('is-active');
    li.addEventListener('click', () => {
      currentPage = i;
      loadPosts();
    });
    pageList.appendChild(li);
  }

  prevBtn.onclick = () => {
    if (currentPage > 1) { currentPage--; loadPosts(); }
  };
  nextBtn.onclick = () => {
    if (currentPage < totalPages) { currentPage++; loadPosts(); }
  };
}

// ── 검색 ──
function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  const doSearch = () => {
    currentKeyword = searchInput.value.trim();
    currentPage = 1;
    loadPosts();
  };

  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });
}

// ── 글쓰기 버튼: 비로그인 시 숨김 ──
function initWriteBtn() {
  const writeBtn = document.getElementById('writeBtn');
  _supabase.auth.getSession().then(({ data: { session } }) => {
    writeBtn.style.display = session ? 'inline-flex' : 'none';
  });
  _supabase.auth.onAuthStateChange((_e, session) => {
    writeBtn.style.display = session ? 'inline-flex' : 'none';
  });
}
