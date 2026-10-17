import { PDFDocument } from 'pdf-lib';
import createQpdf from '@neslinesli93/qpdf-wasm';
import qpdfWasmUrl from '@neslinesli93/qpdf-wasm/dist/qpdf.wasm?url';
import { inject } from '@vercel/analytics';
import './style.css';

inject();

const translations = {
  pt: {
    pageTitle:'JuntaPDF — Junte os seus PDFs',
    description:'Junte vários ficheiros PDF gratuitamente no seu dispositivo. Reordene os documentos e descarregue um único PDF, sem enviar os ficheiros para um servidor.',
    brandLabel:'JuntaPDF início', languageLabel:'Selecionar idioma', privacy:'Os seus ficheiros ficam no seu dispositivo',
    eyebrow:'FERRAMENTA GRATUITA · SEM CADASTRO', title:'Os seus PDFs, juntos. <em>Sem complicação.</em>',
    lead:'Combine vários documentos num só ficheiro, diretamente no seu navegador.',
    workspace:'Juntar ficheiros PDF', add:'Adicione os seus PDFs', empty:'Ainda sem ficheiros',
    dropTitle:'Arraste os PDFs para aqui', dropChoose:'ou <u>selecione no dispositivo</u>', dropHint:'Selecione dois ou mais ficheiros PDF',
    orderHint:'A ordem da lista será mantida no PDF final.', clear:'Remover todos', output:'Nome do ficheiro final',
    merge:'Juntar PDFs', preparing:'A preparar os ficheiros…', privacyNote:'Os documentos são processados no seu dispositivo e não são enviados para um servidor.',
    passwordNote:'Se um PDF estiver protegido, pediremos a palavra-passe para o desbloquear antes de juntar os ficheiros.',
    howTitle:'É simples assim', steps:[['Adicione','Escolha dois ou mais documentos PDF.'],['Organize','Use as setas para definir a ordem das páginas.'],['Descarregue','Junte os documentos e guarde o novo PDF.']],
    footer:'Os seus documentos, sempre privados.', file:'ficheiro', files:'ficheiros', docs:'documentos', total:'no total',
    invalid:'Alguns ficheiros foram ignorados porque não são PDFs.', noFiles:'Ainda sem ficheiros',
    moveUp:'Mover para cima', moveDown:'Mover para baixo', remove:'Remover ficheiro',
    reading:'A ler', creating:'A criar o PDF final…', ready:'PDF pronto!',
    success:'PDF criado com sucesso: {pages} páginas.',
    encrypted:'Um dos ficheiros parece estar protegido por palavra-passe. Remova a proteção e tente novamente.',
    corrupt:'Não foi possível ler um dos PDFs. Confirme que os ficheiros não estão danificados ou protegidos por palavra-passe.',
    langPT:'Português', langEN:'Inglês',
    passwordTitle:'Este PDF está protegido', passwordHelp:'Introduza a palavra-passe para desbloquear este ficheiro e continuar a junção.', passwordField:'Palavra-passe do PDF', passwordPlaceholder:'Introduza a palavra-passe', passwordCancel:'Cancelar', passwordContinue:'Desbloquear e continuar', passwordIncorrect:'Palavra-passe incorreta. Tente novamente.', passwordCancelled:'Junção cancelada. Nenhum ficheiro foi alterado.', passwordFailed:'Não foi possível desbloquear este PDF. Confirme a palavra-passe e tente novamente.'
  },
  en: {
    pageTitle:'MergePDF — Merge your PDFs',
    description:'Merge multiple PDF files for free on your device. Reorder documents and download one PDF without uploading files to a server.',
    brandLabel:'MergePDF home', languageLabel:'Choose language', privacy:'Your files stay on your device',
    eyebrow:'FREE TOOL · NO SIGN-UP', title:'Your PDFs, together. <em>Without the hassle.</em>',
    lead:'Combine multiple documents into one file, right in your browser.',
    workspace:'Merge PDF files', add:'Add your PDFs', empty:'No files yet',
    dropTitle:'Drop PDFs here', dropChoose:'or <u>choose files from your device</u>', dropHint:'Select two or more PDF files',
    orderHint:'The list order will be kept in the final PDF.', clear:'Remove all', output:'Final file name',
    merge:'Merge PDFs', preparing:'Preparing files…', privacyNote:'Your documents are processed on your device and are never uploaded to a server.',
    passwordNote:'If a PDF is protected, we’ll ask for its password before merging.',
    howTitle:'It is that simple', steps:[['Add files','Choose two or more PDF documents.'],['Organize','Use the arrows to set the page order.'],['Download','Merge the documents and save your new PDF.']],
    footer:'Your documents stay private.', file:'file', files:'files', docs:'documents', total:'in total',
    invalid:'Some files were skipped because they are not PDFs.', noFiles:'No files yet',
    moveUp:'Move up', moveDown:'Move down', remove:'Remove file',
    reading:'Reading', creating:'Creating the final PDF…', ready:'PDF ready!',
    success:'PDF created successfully: {pages} pages.',
    encrypted:'One of the files appears to be password-protected. Remove the protection and try again.',
    corrupt:'Could not read one of the PDFs. Check that the files are not damaged or password-protected.',
    langPT:'Portuguese', langEN:'English',
    passwordTitle:'This PDF is password-protected', passwordHelp:'Enter the password to unlock this file and continue merging.', passwordField:'PDF password', passwordPlaceholder:'Enter the password', passwordCancel:'Cancel', passwordContinue:'Unlock and continue', passwordIncorrect:'Incorrect password. Please try again.', passwordCancelled:'Merge cancelled. No files were changed.', passwordFailed:'Could not unlock this PDF. Check the password and try again.'
  }
};
let language = localStorage.getItem('juntapdf-language') === 'en' ? 'en' : 'pt';
const t = key => translations[language][key];
const app = document.querySelector('#app');

app.innerHTML = `
  <header class="topbar">
    <a class="brand" href="/" aria-label="JuntaPDF início"><span class="brand-mark">✳</span><span id="brand-name">junta<span class="brand-light">PDF</span></span></a>
    <div class="topbar-tools">
      <span class="privacy"><i></i><span id="privacy-label"></span></span>
      <nav class="language-switch" aria-label="Selecionar idioma">
        <button type="button" data-language="pt" aria-label="Português" title="Português">🇧🇷</button>
        <button type="button" data-language="en" aria-label="English" title="English">🇺🇸</button>
      </nav>
    </div>
  </header>
  <main>
    <section class="intro"><div class="eyebrow"><span class="eyebrow-line"></span><span id="eyebrow-text"></span></div><h1 id="page-heading"></h1><p id="lead" class="lead"></p></section>
    <section id="workspace" class="workspace">
      <div class="step-label"><span class="step-number">1</span><span id="add-label"></span><span id="file-count" class="step-note"></span></div>
      <label id="dropzone" class="dropzone" for="pdf-files" tabindex="0">
        <input id="pdf-files" type="file" accept="application/pdf,.pdf" multiple hidden />
        <span class="upload-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14"/></svg></span>
        <strong id="drop-title"></strong><span id="drop-choose"></span><small id="drop-hint"></small>
      </label>
      <div id="error" class="error" role="alert" hidden></div>
      <div id="file-list" class="file-list" aria-live="polite"></div>
      <div class="list-actions"><span id="total-size"></span><button id="clear" class="text-button" hidden></button></div>
      <div class="options"><label id="output-label" for="output-name"></label><div class="filename"><input id="output-name" type="text" value="documentos-unidos" maxlength="80"><span>.pdf</span></div></div>
      <button id="merge" class="primary" disabled><span id="merge-label"></span><span aria-hidden="true">→</span></button>
      <div id="progress-wrap" class="progress-wrap" hidden><div class="progress-head"><span id="progress-label"></span><span id="progress-percent"></span></div><div class="track"><div id="progress-bar"></div></div></div>
      <div class="privacy-note"><span class="lock" aria-hidden="true">▣</span><span><span id="privacy-note"></span><br><small id="password-note"></small></span></div>
      <div id="success" class="success" role="status" hidden></div>
    </section>
    <section class="how"><div id="how-title" class="how-title"></div><div id="how-grid" class="how-grid"></div></section>
    <footer><span id="footer-note"></span><span>JuntaPDF</span></footer>
    <div id="password-modal" class="modal" hidden>
      <section class="password-dialog" role="dialog" aria-modal="true" aria-labelledby="password-title">
        <div class="password-lock" aria-hidden="true">▣</div>
        <h2 id="password-title"></h2>
        <p id="password-help"></p>
        <p id="password-filename" class="password-filename"></p>
        <form id="password-form">
          <label id="password-label" for="pdf-password"></label>
          <input id="pdf-password" type="password" autocomplete="current-password">
          <p id="password-error" class="password-error" role="alert" hidden></p>
          <div class="password-actions"><button id="password-cancel" class="secondary" type="button"></button><button id="password-submit" class="primary" type="submit"></button></div>
        </form>
      </section>
    </div>
  </main>`;

const input = document.querySelector('#pdf-files');
const drop = document.querySelector('#dropzone');
const list = document.querySelector('#file-list');
const mergeButton = document.querySelector('#merge');
const errorBox = document.querySelector('#error');
const successBox = document.querySelector('#success');
const clearButton = document.querySelector('#clear');
const progressWrap = document.querySelector('#progress-wrap');
const passwordModal = document.querySelector('#password-modal');
const passwordForm = document.querySelector('#password-form');
const passwordInput = document.querySelector('#pdf-password');
let qpdfPromise = null;
let qpdfMessages = [];
let passwordResolver = null;
let files = [];
let busy = false;
let status = null;

const formatSize = bytes => bytes < 1024 ** 2 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  successBox.hidden = true;
  status = {type:'error', message};
}
function renderFiles() {
  list.innerHTML = files.map((file, index) => `
    <article class="file-row" data-index="${index}">
      <span class="pdf-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 2.75h8l4 4v14.5H6z"/><path d="M14 2.75v4h4M8.5 15h7M8.5 18h5"/><path d="M8.5 11h1.4a1.1 1.1 0 0 1 0 2.2H8.5z"/></svg></span>
      <span class="file-info"><strong title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</strong><small>${formatSize(file.size)}</small></span>
      <span class="file-controls">
        <button class="icon-button" data-action="up" aria-label="${t('moveUp')} ${escapeHtml(file.name)}" title="${t('moveUp')}" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button class="icon-button" data-action="down" aria-label="${t('moveDown')} ${escapeHtml(file.name)}" title="${t('moveDown')}" ${index === files.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="icon-button remove" data-action="remove" aria-label="${t('remove')} ${escapeHtml(file.name)}" title="${t('remove')}">×</button>
      </span>
    </article>`).join('');
  document.querySelector('#file-count').textContent = files.length ? `${files.length} ${files.length === 1 ? t('file') : t('files')}` : t('empty');
  document.querySelector('#total-size').textContent = files.length
    ? `${files.length} ${t('docs')} · ${formatSize(files.reduce((sum, file) => sum + file.size, 0))} ${t('total')}`
    : t('orderHint');
  clearButton.hidden = files.length === 0;
  mergeButton.disabled = busy || files.length < 2;
}
function applyLanguage() {
  const strings = translations[language];
  document.documentElement.lang = language === 'pt' ? 'pt-PT' : 'en';
  document.title = strings.pageTitle;
  document.querySelector('meta[name="description"]').content = strings.description;
  document.querySelector('.brand').setAttribute('aria-label', strings.brandLabel);
  document.querySelector('#brand-name').innerHTML = language === 'pt' ? 'junta<span class="brand-light">PDF</span>' : 'merge<span class="brand-light">PDF</span>';
  document.querySelector('.language-switch').setAttribute('aria-label', strings.languageLabel);
  document.querySelectorAll('.language-switch button').forEach(button => {
    const selected = button.dataset.language === language;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
    button.title = button.dataset.language === 'pt' ? strings.langPT : strings.langEN;
  });
  document.querySelector('#privacy-label').textContent = strings.privacy;
  document.querySelector('#eyebrow-text').textContent = strings.eyebrow;
  document.querySelector('#page-heading').innerHTML = strings.title;
  document.querySelector('#lead').textContent = strings.lead;
  document.querySelector('#workspace').setAttribute('aria-label', strings.workspace);
  document.querySelector('#add-label').textContent = strings.add;
  document.querySelector('#drop-title').textContent = strings.dropTitle;
  document.querySelector('#drop-choose').innerHTML = strings.dropChoose;
  document.querySelector('#drop-hint').textContent = strings.dropHint;
  document.querySelector('#clear').textContent = strings.clear;
  document.querySelector('#output-label').textContent = strings.output;
  document.querySelector('#output-name').setAttribute('aria-label', strings.output);
  document.querySelector('#merge-label').textContent = strings.merge;
  document.querySelector('#privacy-note').textContent = strings.privacyNote;
  document.querySelector('#password-note').textContent = strings.passwordNote;
  document.querySelector('#how-title').textContent = strings.howTitle;
  document.querySelector('#how-grid').innerHTML = strings.steps.map((step, index) => `<article><span>0${index + 1}</span><h3>${step[0]}</h3><p>${step[1]}</p></article>`).join('');
  document.querySelector('#footer-note').textContent = strings.footer;
  document.querySelector('#password-title').textContent = strings.passwordTitle;
  document.querySelector('#password-help').textContent = strings.passwordHelp;
  document.querySelector('#password-label').textContent = strings.passwordField;
  passwordInput.placeholder = strings.passwordPlaceholder;
  document.querySelector('#password-cancel').textContent = strings.passwordCancel;
  document.querySelector('#password-submit').textContent = strings.passwordContinue;
  if (['documentos-unidos','merged-documents'].includes(document.querySelector('#output-name').value)) {
    document.querySelector('#output-name').value = language === 'pt' ? 'documentos-unidos' : 'merged-documents';
  }
  renderFiles();
  if (status?.type === 'error') {
    errorBox.textContent = status.message;
    errorBox.hidden = false;
  } else if (status?.type === 'success') {
    successBox.textContent = strings.success.replace('{pages}', status.pages);
    successBox.hidden = false;
  }
}
function addFiles(incoming) {
  errorBox.hidden = true;
  successBox.hidden = true;
  status = null;
  const rejected = [];
  for (const file of incoming) {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') { rejected.push(file.name); continue; }
    if (files.some(existing => existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified)) continue;
    files.push(file);
  }
  renderFiles();
  if (rejected.length) showError(t('invalid'));
}
function setProgress(label, percent) {
  document.querySelector('#progress-label').textContent = label;
  document.querySelector('#progress-percent').textContent = `${Math.round(percent)}%`;
  document.querySelector('#progress-bar').style.width = `${percent}%`;
}
function askForPassword(file, message = '') {
  return new Promise(resolve => {
    passwordResolver = resolve;
    document.querySelector('#password-filename').textContent = file.name;
    document.querySelector('#password-error').textContent = message;
    document.querySelector('#password-error').hidden = !message;
    passwordInput.value = '';
    passwordModal.hidden = false;
    requestAnimationFrame(() => passwordInput.focus());
  });
}
function closePasswordPrompt(password) {
  if (!passwordResolver) return;
  const resolve = passwordResolver;
  passwordResolver = null;
  passwordModal.hidden = true;
  resolve(password);
}
async function getQpdf() {
  if (!qpdfPromise) {
    qpdfPromise = createQpdf({ locateFile: () => qpdfWasmUrl, noInitialRun: true, printErr: message => qpdfMessages.push(String(message)) });
  }
  return qpdfPromise;
}
async function decryptPdf(file, password) {
  const qpdf = await getQpdf();
  const suffix = crypto.randomUUID();
  const inputPath = `/input-${suffix}.pdf`;
  const outputPath = `/output-${suffix}.pdf`;
  qpdfMessages = [];
  qpdf.FS.writeFile(inputPath, new Uint8Array(await file.arrayBuffer()));
  try {
    try {
      qpdf.callMain([`--password=${password}`, '--decrypt', inputPath, outputPath]);
    } catch (error) {
      qpdfMessages.push(String(error?.message || error));
    }
    if (!qpdf.FS.analyzePath(outputPath).exists) {
      const detail = qpdfMessages.join(' ');
      if (/password|encrypt|invalid/i.test(detail)) return { incorrect: true };
      throw new Error('QPDF could not decrypt this file.');
    }
    return { bytes: qpdf.FS.readFile(outputPath).slice() };
  } finally {
    for (const path of [inputPath, outputPath]) {
      try { if (qpdf.FS.analyzePath(path).exists) qpdf.FS.unlink(path); } catch { /* Clean up best-effort. */ }
    }
  }
}
async function loadPdf(file) {
  const original = await file.arrayBuffer();
  try {
    return await PDFDocument.load(original);
  } catch (error) {
    if (!/encrypt/i.test(error.message || '')) throw error;
  }
  // Some PDFs open without a password but still have owner restrictions.
  // Try an empty password first so those files can be merged without prompting.
  let noPasswordResult = null;
  try {
    noPasswordResult = await decryptPdf(file, '');
  } catch {
    // A failed empty-password attempt should still allow the user to enter a password.
  }
  if (noPasswordResult && !noPasswordResult.incorrect) {
    try {
      return await PDFDocument.load(noPasswordResult.bytes);
    } catch (error) {
      if (!/encrypt/i.test(error.message || '')) throw error;
    }
  }

  let message = '';
  while (true) {
    const password = await askForPassword(file, message);
    if (password === null) throw new Error('PASSWORD_CANCELLED');
    const result = await decryptPdf(file, password);
    if (result.incorrect) {
      message = t('passwordIncorrect');
      continue;
    }
    return PDFDocument.load(result.bytes);
  }
}

app.addEventListener('click', event => {
  const languageButton = event.target.closest('[data-language]');
  if (languageButton) {
    language = languageButton.dataset.language;
    localStorage.setItem('juntapdf-language', language);
    applyLanguage();
    return;
  }
  const fileButton = event.target.closest('button[data-action]');
  if (!fileButton || busy) return;
  const index = Number(fileButton.closest('.file-row').dataset.index);
  if (fileButton.dataset.action === 'remove') files.splice(index, 1);
  if (fileButton.dataset.action === 'up' && index > 0) [files[index - 1], files[index]] = [files[index], files[index - 1]];
  if (fileButton.dataset.action === 'down' && index < files.length - 1) [files[index + 1], files[index]] = [files[index], files[index + 1]];
  renderFiles();
});
input.addEventListener('change', event => { addFiles(event.target.files); input.value = ''; });
for (const eventName of ['dragenter','dragover']) drop.addEventListener(eventName, event => { event.preventDefault(); drop.classList.add('dragging'); });
for (const eventName of ['dragleave','drop']) drop.addEventListener(eventName, event => { event.preventDefault(); drop.classList.remove('dragging'); });
drop.addEventListener('drop', event => addFiles(event.dataTransfer.files));
drop.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.click(); } });
clearButton.addEventListener('click', () => { files = []; status = null; errorBox.hidden = true; successBox.hidden = true; renderFiles(); });
passwordForm.addEventListener('submit', event => { event.preventDefault(); closePasswordPrompt(passwordInput.value); });
document.querySelector('#password-cancel').addEventListener('click', () => closePasswordPrompt(null));

mergeButton.addEventListener('click', async () => {
  if (busy || files.length < 2) return;
  busy = true;
  status = null;
  errorBox.hidden = true;
  successBox.hidden = true;
  progressWrap.hidden = false;
  mergeButton.disabled = true;
  try {
    const merged = await PDFDocument.create();
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      setProgress(`${t('reading')} ${file.name}…`, (index / files.length) * 90);
      const source = await loadPdf(file);
      const copiedPages = await merged.copyPages(source, source.getPageIndices());
      copiedPages.forEach(page => merged.addPage(page));
    }
    setProgress(t('creating'), 96);
    const bytes = await merged.save();
    const blob = new Blob([bytes], {type:'application/pdf'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const baseName = document.querySelector('#output-name').value.trim().replace(/\.pdf$/i, '') || (language === 'pt' ? 'documentos-unidos' : 'merged-documents');
    link.href = url;
    link.download = `${baseName}.pdf`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    const pages = merged.getPageCount();
    setProgress(t('ready'), 100);
    status = {type:'success', pages};
    successBox.textContent = t('success').replace('{pages}', pages);
    successBox.hidden = false;
  } catch (error) {
    console.error(error);
    showError(error.message === 'PASSWORD_CANCELLED' ? t('passwordCancelled') : (/encrypt|password/i.test(error.message || '') ? t('passwordFailed') : t('corrupt')));
  } finally {
    busy = false;
    mergeButton.disabled = files.length < 2;
    setTimeout(() => { progressWrap.hidden = true; }, 1800);
  }
});
applyLanguage();
