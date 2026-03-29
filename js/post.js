// post.js - 게시글 상세 (조회, 수정, 삭제, 댓글)

const postId = new URLSearchParams(location.search).get('id');

async function initPage() {
  if (!postId) { location.href = 'board.html'; return; }
  let session = null;
  try {
    const { data } = await _supabase.auth.getSession();
    session = data?.session ?? null;
  } catch(e) {
    console.warn('[진단] getSession 오류:', e);
  }
  console.log('[진단] initPage 실행, session:', session ? '로그인' : '비로그인');
  await loadPost(session);
  await loadComments(session);
}

document.addEventListener('DOMContentLoaded', initPage);

// bfcache 복원 시에도 재초기화 (뒤로가기 후 재진입 케이스)
window.addEventListener('pageshow', (e) => {
  if (e.persisted) initPage();
});

// ── 게시글 조회 ──
async function loadPost(session) {
  // 조회수 증가
  const { error: rpcError } = await _supabase.rpc('increment_views', { post_id: Number(postId) });
  console.log('[진단] increment_views 결과:', rpcError ? rpcError.message : '성공');

  // Supabase 클라이언트 캐시 우회: native fetch로 직접 조회
  let post, error;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?id=eq.${postId}&select=*&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Accept': 'application/json'
        },
        cache: 'no-store'
      }
    );
    const rows = await res.json();
    post = rows[0] || null;
    console.log('[진단] fetch 결과, views:', post?.views);
  } catch(e) {
    error = e;
    console.error('[진단] fetch 오류:', e);
  }

  if (error || !post) {
    document.getElementById('postInner').innerHTML = '<p style="text-align:center;padding:60px 0;color:#aaa;">게시글을 찾을 수 없습니다.</p>';
    return;
  }

  const isOwner = session && session.user.id === post.user_id;
  const isAdminActive = isAdmin(session) && isAdminMode();
  const canEdit = isOwner || isAdminActive;
  const canDelete = isAdminActive; // 삭제는 관리자만
  const date = post.created_at.slice(0, 10);

  document.getElementById('postInner').innerHTML = `
    ${(canEdit || canDelete) ? `
      <div class="post__actions">
        ${canEdit ? `<button class="post__edit-btn" id="editBtn">수정</button>` : ''}
        ${canDelete ? `<button class="post__del-btn" id="delBtn">삭제</button>` : ''}
      </div>` : ''}

    <div class="post__header">
      <h2 class="post__title">${post.title}</h2>
      <div class="post__meta">
        <span>${post.author_name}</span>
        <span>${date}</span>
        <span>조회 ${post.views}</span>
      </div>
    </div>

    ${post.image_url ? `
      <div class="post__image">
        <img src="${post.image_url}" alt="첨부 이미지">
      </div>` : ''}

    <div class="post__content">${post.content}</div>

    <a href="board.html" class="post__back">목록으로</a>

    <div class="post__comments">
      <h3 class="post__comments-title">댓글</h3>
      <div class="comment__form">
        ${!session ? `<input type="text" class="comment__input comment__input--name" id="commentAuthor" placeholder="닉네임">` : ''}
        <input type="text" class="comment__input" id="commentInput" placeholder="댓글을 입력하세요">
        <button class="comment__submit" id="commentSubmit">등록</button>
      </div>
      <ul class="comment__list" id="commentList"></ul>
    </div>
  `;

  // 수정 이벤트 (본인 또는 관리자)
  if (canEdit) {
    document.getElementById('editBtn').addEventListener('click', () => {
      location.href = `write.html?id=${postId}`;
    });
  }

  // 삭제 이벤트 (관리자만)
  if (canDelete) {
    document.getElementById('delBtn').addEventListener('click', () => deletePost(post));
  }

  // 댓글 등록 이벤트 (로그인/비회원 모두)
  document.getElementById('commentSubmit').addEventListener('click', () => submitComment(session));
  document.getElementById('commentInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitComment(session);
  });
}

// ── 게시글 삭제 ──
async function deletePost(post) {
  if (!confirm('게시글을 삭제하시겠습니까?')) return;

  // 이미지 삭제
  if (post.image_url) {
    const fileName = post.image_url.split('/').pop();
    await _supabase.storage.from('post-images').remove([fileName]);
  }

  const { error } = await _supabase.from('posts').delete().eq('id', postId);
  if (error) { alert('삭제에 실패했습니다.'); return; }
  location.href = 'board.html';
}

// ── 댓글 조회 ──
async function loadComments(session) {
  const { data: comments } = await _supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  renderComments(comments || [], session);
}

// ── 댓글 렌더링 ──
function renderComments(comments, session) {
  const list = document.getElementById('commentList');
  if (!list) return;

  if (!comments.length) {
    list.innerHTML = '<li class="comment__empty">첫 번째 댓글을 남겨보세요.</li>';
    return;
  }

  list.innerHTML = comments.map(c => {
    const isOwner = (session && session.user.id === c.user_id) || (isAdmin(session) && isAdminMode());
    const date = c.created_at.slice(0, 10);
    return `
      <li class="comment__item" data-id="${c.id}">
        <div class="comment__meta">
          <span class="comment__author">${c.author_name}</span>
          <div style="display:flex;gap:12px;align-items:center">
            <span class="comment__date">${date}</span>
            ${isOwner ? `<button class="comment__del" data-id="${c.id}">삭제</button>` : ''}
          </div>
        </div>
        <p class="comment__text">${c.content}</p>
      </li>`;
  }).join('');

  // 댓글 삭제 이벤트
  list.querySelectorAll('.comment__del').forEach(btn => {
    btn.addEventListener('click', () => deleteComment(btn.dataset.id, session));
  });
}

// ── 댓글 등록 ──
async function submitComment(session) {
  const input = document.getElementById('commentInput');
  const content = input.value.trim();
  if (!content) return;

  // 작성자명: 로그인 시 이메일 아이디, 비회원 시 입력한 닉네임
  let authorName, userId;
  if (session) {
    authorName = getAuthorName(session.user.email);
    userId = session.user.id;
  } else {
    const authorInput = document.getElementById('commentAuthor');
    authorName = authorInput ? authorInput.value.trim() : '익명';
    if (!authorName) { alert('닉네임을 입력해주세요.'); authorInput.focus(); return; }
    userId = null;
  }

  const { error } = await _supabase.from('comments').insert({
    post_id: Number(postId),
    user_id: userId,
    author_name: authorName,
    content
  });

  if (error) { alert('댓글 등록에 실패했습니다.'); return; }
  input.value = '';
  await loadComments(session);
}

// ── 댓글 삭제 ──
async function deleteComment(commentId, session) {
  if (!confirm('댓글을 삭제하시겠습니까?')) return;
  const { error } = await _supabase.from('comments').delete().eq('id', commentId);
  if (error) { alert('삭제에 실패했습니다.'); return; }
  await loadComments(session);
}
