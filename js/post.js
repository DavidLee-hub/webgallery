// post.js - 게시글 상세 (조회, 수정, 삭제, 댓글)

const postId = new URLSearchParams(location.search).get('id');

document.addEventListener('DOMContentLoaded', async () => {
  if (!postId) { location.href = 'board.html'; return; }

  const { data: { session } } = await _supabase.auth.getSession();
  await loadPost(session);
  await loadComments(session);
});

// ── 게시글 조회 ──
async function loadPost(session) {
  // 조회수 증가
  try { await _supabase.rpc('increment_views', { post_id: Number(postId) }); } catch(e) {}

  const { data: post, error } = await _supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error || !post) {
    document.getElementById('postInner').innerHTML = '<p style="text-align:center;padding:60px 0;color:#aaa;">게시글을 찾을 수 없습니다.</p>';
    return;
  }

  const isOwner = (session && session.user.id === post.user_id) || (isAdmin(session) && isAdminMode());
  const date = post.created_at.slice(0, 10);

  document.getElementById('postInner').innerHTML = `
    ${isOwner ? `
      <div class="post__actions">
        <button class="post__edit-btn" id="editBtn">수정</button>
        <button class="post__del-btn" id="delBtn">삭제</button>
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
      ${session ? `
        <div class="comment__form">
          <input type="text" class="comment__input" id="commentInput" placeholder="댓글을 입력하세요">
          <button class="comment__submit" id="commentSubmit">등록</button>
        </div>` : '<p class="comment__empty">댓글을 작성하려면 로그인하세요.</p>'}
      <ul class="comment__list" id="commentList"></ul>
    </div>
  `;

  // 수정/삭제 이벤트
  if (isOwner) {
    document.getElementById('editBtn').addEventListener('click', () => {
      location.href = `write.html?id=${postId}`;
    });
    document.getElementById('delBtn').addEventListener('click', () => deletePost(post));
  }

  // 댓글 등록 이벤트
  if (session) {
    document.getElementById('commentSubmit').addEventListener('click', () => submitComment(session));
    document.getElementById('commentInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') submitComment(session);
    });
  }
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

  const { error } = await _supabase.from('comments').insert({
    post_id: Number(postId),
    user_id: session.user.id,
    author_name: getAuthorName(session.user.email),
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
