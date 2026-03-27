// write.js - 글쓰기 / 수정 (Supabase 연동)

let selectedFile = null;
let existingImageUrl = null;
const editId = new URLSearchParams(location.search).get('id'); // 수정 모드 시 id 존재

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await _supabase.auth.getSession();
  if (!session) {
    alert('로그인이 필요합니다.');
    location.href = 'board.html';
    return;
  }

  // 수정 모드: 기존 데이터 로드
  if (editId) {
    document.querySelector('.write__title').textContent = '글 수정';
    document.querySelector('.write__submit').textContent = '수정';
    await loadPostData(session);
  }

  initImageUpload();
  initForm(session);
});

// ── 수정 모드: 기존 데이터 불러오기 ──
async function loadPostData(session) {
  const { data: post, error } = await _supabase
    .from('posts')
    .select('*')
    .eq('id', editId)
    .single();

  if (error || !post || post.user_id !== session.user.id) {
    alert('수정 권한이 없습니다.');
    location.href = 'board.html';
    return;
  }

  document.getElementById('postTitle').value   = post.title;
  document.getElementById('postContent').value = post.content;

  if (post.image_url) {
    existingImageUrl = post.image_url;
    document.getElementById('uploadName').textContent = '기존 이미지 있음';
    document.getElementById('previewImg').src = post.image_url;
    document.getElementById('previewWrap').style.display = 'block';
  }
}

// ── 이미지 업로드 초기화 ──
function initImageUpload() {
  const uploadBtn   = document.getElementById('uploadBtn');
  const postImage   = document.getElementById('postImage');
  const uploadName  = document.getElementById('uploadName');
  const previewWrap = document.getElementById('previewWrap');
  const previewImg  = document.getElementById('previewImg');
  const previewDel  = document.getElementById('previewDel');

  uploadBtn.addEventListener('click', () => postImage.click());

  postImage.addEventListener('change', () => {
    const file = postImage.files[0];
    if (!file) return;
    selectedFile = file;
    uploadName.textContent = file.name;

    const reader = new FileReader();
    reader.onload = e => {
      previewImg.src = e.target.result;
      previewWrap.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  previewDel.addEventListener('click', () => {
    selectedFile = null;
    existingImageUrl = null;
    postImage.value = '';
    uploadName.textContent = '선택된 파일 없음';
    previewWrap.style.display = 'none';
    previewImg.src = '';
  });
}

// ── 폼 제출 (등록 / 수정) ──
function initForm(session) {
  const form    = document.getElementById('writeForm');
  const errorEl = document.getElementById('writeError');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorEl.textContent = '';

    const title   = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();

    if (!title)   { errorEl.textContent = '제목을 입력해주세요.'; return; }
    if (!content) { errorEl.textContent = '내용을 입력해주세요.'; return; }

    let image_url = existingImageUrl;

    // 새 이미지 업로드
    if (selectedFile) {
      const ext      = selectedFile.name.split('.').pop();
      const fileName = `${session.user.id}_${Date.now()}.${ext}`;
      const { error: uploadError } = await _supabase.storage
        .from('post-images')
        .upload(fileName, selectedFile);

      if (uploadError) { errorEl.textContent = '이미지 업로드에 실패했습니다.'; return; }

      const { data } = _supabase.storage.from('post-images').getPublicUrl(fileName);
      image_url = data.publicUrl;
    }

    if (editId) {
      // 수정
      const { error } = await _supabase.from('posts')
        .update({ title, content, image_url })
        .eq('id', editId);
      if (error) { errorEl.textContent = '수정에 실패했습니다.'; return; }
      location.href = `post.html?id=${editId}`;
    } else {
      // 신규 등록
      const { error } = await _supabase.from('posts').insert({
        title,
        content,
        author_name: getAuthorName(session.user.email),
        user_id: session.user.id,
        image_url
      });
      if (error) { errorEl.textContent = '게시글 등록에 실패했습니다.'; return; }
      location.href = 'board.html';
    }
  });
}
