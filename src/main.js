import { PDFDocument } from 'pdf-lib';
import { inject } from '@vercel/analytics';
import './style.css';

inject();

const app = document.querySelector('#app');
app.innerHTML = `
  <header class="topbar">
    <a class="brand" href="/" aria-label="JuntaPDF início"><span class="brand-mark">✳</span><span>junta<span class="brand-light">PDF</span></span></a>
    <span class="privacy"><i></i> Os seus ficheiros ficam no seu dispositivo</span>
  </header>
  <main>
    <section class="intro">
      <div class="eyebrow"><span class="eyebrow-line"></span> FERRAMENTA GRATUITA · SEM CADASTRO</div>
      <h1>Os seus PDFs, juntos. <em>Sem complicação.</em></h1>
      <p class="lead">Combine vários documentos num só ficheiro, diretamente no seu navegador.</p>
    </section>
    <section class="workspace" aria-label="Juntar ficheiros PDF">
      <div class="step-label"><span class="step-number">1</span><span>Adicione os seus PDFs</span><span id="file-count" class="step-note">Ainda sem ficheiros</span></div>
      <label id="dropzone" class="dropzone" for="pdf-files" tabindex="0">
        <input id="pdf-files" type="file" accept="application/pdf,.pdf" multiple hidden />
        <span class="upload-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14"/></svg></span>
        <strong>Arraste os PDFs para aqui</strong><span>ou <u>selecione no dispositivo</u></span>
        <small>Selecione dois ou mais ficheiros PDF</small>
      </label>
      <div id="error" class="error" role="alert" hidden></div>
      <div id="file-list" class="file-list" aria-live="polite"></div>
      <div class="list-actions"><span id="total-size">A ordem da lista será mantida no PDF final.</span><button id="clear" class="text-button" hidden>Remover todos</button></div>
      <div class="options">
        <label for="output-name">Nome do ficheiro final</label>
        <div class="filename"><input id="output-name" type="text" value="documentos-unidos" maxlength="80" aria-label="Nome do ficheiro final"><span>.pdf</span></div>
      </div>
      <button id="merge" class="primary" disabled><span>Juntar PDFs</span><span aria-hidden="true">→</span></button>
      <div id="progress-wrap" class="progress-wrap" hidden><div class="progress-head"><span id="progress-label">A preparar os ficheiros…</span><span id="progress-percent"></span></div><div class="track"><div id="progress-bar"></div></div></div>
      <div class="privacy-note"><span class="lock" aria-hidden="true">▣</span><span>Os documentos são processados no seu dispositivo e não são enviados para um servidor.<br><small>PDFs protegidos por palavra-passe não podem ser unidos nesta versão.</small></span></div>
      <div id="success" class="success" role="status" hidden></div>
    </section>
    <section class="how"><div class="how-title">É simples assim</div><div class="how-grid"><article><span>01</span><h3>Adicione</h3><p>Escolha dois ou mais documentos PDF.</p></article><article><span>02</span><h3>Organize</h3><p>Use as setas para definir a ordem das páginas.</p></article><article><span>03</span><h3>Descarregue</h3><p>Junte os documentos e guarde o novo PDF.</p></article></div></section>
    <footer>Os seus documentos, sempre privados. <span>JuntaPDF</span></footer>
  </main>`;

const input = document.querySelector('#pdf-files');
const drop = document.querySelector('#dropzone');
const list = document.querySelector('#file-list');
const mergeButton = document.querySelector('#merge');
const errorBox = document.querySelector('#error');
const successBox = document.querySelector('#success');
const clearButton = document.querySelector('#clear');
const progressWrap = document.querySelector('#progress-wrap');
let files = [];
let busy = false;

const formatSize = bytes => bytes < 1024 ** 2 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  successBox.hidden = true;
}
function render() {
  list.innerHTML = files.map((file, index) => `
    <article class="file-row" data-index="${index}">
      <span class="pdf-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 2.75h8l4 4v14.5H6z"/><path d="M14 2.75v4h4M8.5 15h7M8.5 18h5"/><path d="M8.5 11h1.4a1.1 1.1 0 0 1 0 2.2H8.5z"/></svg></span>
      <span class="file-info"><strong title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</strong><small>${formatSize(file.size)}</small></span>
      <span class="file-controls">
        <button class="icon-button" data-action="up" aria-label="Mover ${escapeHtml(file.name)} para cima" title="Mover para cima" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button class="icon-button" data-action="down" aria-label="Mover ${escapeHtml(file.name)} para baixo" title="Mover para baixo" ${index === files.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="icon-button remove" data-action="remove" aria-label="Remover ${escapeHtml(file.name)}" title="Remover ficheiro">×</button>
      </span>
    </article>`).join('');
  document.querySelector('#file-count').textContent = files.length ? `${files.length} ${files.length === 1 ? 'ficheiro' : 'ficheiros'}` : 'Ainda sem ficheiros';
  document.querySelector('#total-size').textContent = files.length
    ? `${files.length} documentos · ${formatSize(files.reduce((sum, file) => sum + file.size, 0))} no total`
    : 'A ordem da lista será mantida no PDF final.';
  clearButton.hidden = files.length === 0;
  mergeButton.disabled = busy || files.length < 2;
}
function addFiles(incoming) {
  errorBox.hidden = true;
  successBox.hidden = true;
  const rejected = [];
  for (const file of incoming) {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') { rejected.push(file.name); continue; }
    if (files.some(existing => existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified)) continue;
    files.push(file);
  }
  render();
  if (rejected.length) showError('Alguns ficheiros foram ignorados porque não são PDFs.');
}
input.addEventListener('change', event => { addFiles(event.target.files); input.value = ''; });
for (const event of ['dragenter','dragover']) drop.addEventListener(event, eventObject => { eventObject.preventDefault(); drop.classList.add('dragging'); });
for (const event of ['dragleave','drop']) drop.addEventListener(event, eventObject => { eventObject.preventDefault(); drop.classList.remove('dragging'); });
drop.addEventListener('drop', event => addFiles(event.dataTransfer.files));
drop.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.click(); } });
list.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button || busy) return;
  const row = button.closest('.file-row');
  const index = Number(row.dataset.index);
  if (button.dataset.action === 'remove') files.splice(index, 1);
  if (button.dataset.action === 'up' && index > 0) [files[index - 1], files[index]] = [files[index], files[index - 1]];
  if (button.dataset.action === 'down' && index < files.length - 1) [files[index + 1], files[index]] = [files[index], files[index + 1]];
  render();
});
clearButton.addEventListener('click', () => { files = []; errorBox.hidden = true; successBox.hidden = true; render(); });

function setProgress(label, percent) {
  document.querySelector('#progress-label').textContent = label;
  document.querySelector('#progress-percent').textContent = `${Math.round(percent)}%`;
  document.querySelector('#progress-bar').style.width = `${percent}%`;
}
mergeButton.addEventListener('click', async () => {
  if (busy || files.length < 2) return;
  busy = true;
  errorBox.hidden = true;
  successBox.hidden = true;
  progressWrap.hidden = false;
  mergeButton.disabled = true;
  try {
    const merged = await PDFDocument.create();
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      setProgress(`A ler ${file.name}…`, (index / files.length) * 90);
      const source = await PDFDocument.load(await file.arrayBuffer());
      const copiedPages = await merged.copyPages(source, source.getPageIndices());
      copiedPages.forEach(page => merged.addPage(page));
    }
    setProgress('A criar o PDF final…', 96);
    const bytes = await merged.save();
    const blob = new Blob([bytes], {type:'application/pdf'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const baseName = document.querySelector('#output-name').value.trim().replace(/\.pdf$/i, '') || 'documentos-unidos';
    link.href = url;
    link.download = `${baseName}.pdf`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setProgress('PDF pronto!', 100);
    successBox.textContent = `PDF criado com sucesso: ${copiedPageCount(merged)} páginas.`;
    successBox.hidden = false;
  } catch (error) {
    console.error(error);
    const message = /encrypt|password/i.test(error.message || '')
      ? 'Um dos ficheiros parece estar protegido por palavra-passe. Remova a proteção e tente novamente.'
      : 'Não foi possível ler um dos PDFs. Confirme que os ficheiros não estão danificados ou protegidos por palavra-passe.';
    showError(message);
  } finally {
    busy = false;
    mergeButton.disabled = files.length < 2;
    setTimeout(() => { progressWrap.hidden = true; }, 1800);
  }
});
function copiedPageCount(document) { return document.getPageCount(); }
render();
