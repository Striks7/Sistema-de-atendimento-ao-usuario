const INVENTORY_KEY = 'saus-inventory-v1';
const MOVEMENTS_KEY = 'saus-movements-v1';
const PEOPLE_KEY = 'saus-people-v1';
const SESSION_KEY = 'saus-session-v1';
const page = document.querySelector('#page-content');
const modal = document.querySelector('#modal-backdrop');
const navLinks = [...document.querySelectorAll('[data-view]')];
const today = new Date();
const accounts = {
  admin: { password: 'SAUS2026', name: 'Administrador', role: 'Administrador' },
  atendente: { password: 'SAUS2026', name: 'Atendente', role: 'Atendente' }
};
const starterInventory = [
  { id: 'EQ-0005', name: 'Monitor', category: 'Monitores', brand: 'Dell', model: 'P2422H', serial: '', quantity: 8, minimum: 2, location: 'Almoxarifado', notes: '' },
  { id: 'EQ-0004', name: 'Computador desktop', category: 'Computadores', brand: 'Lenovo', model: 'ThinkCentre M70q', serial: '', quantity: 5, minimum: 2, location: 'Almoxarifado', notes: '' },
  { id: 'EQ-0003', name: 'Estabilizador', category: 'Energia', brand: 'SMS', model: 'Revolution Speedy 1000', serial: '', quantity: 2, minimum: 3, location: 'Almoxarifado', notes: '' },
  { id: 'EQ-0002', name: 'Notebook', category: 'Computadores', brand: 'Dell', model: 'Latitude 5440', serial: '', quantity: 4, minimum: 1, location: 'Sala de TI', notes: '' },
  { id: 'EQ-0001', name: 'Teclado USB', category: 'Periféricos', brand: 'Logitech', model: 'K120', serial: '', quantity: 12, minimum: 3, location: 'Almoxarifado', notes: '' }
];
const starterMovements = [
  { id: 'MOV-0005', equipmentId: 'EQ-0005', type: 'Entrada', quantity: 8, date: '2026-10-20', responsible: 'Atendente', reason: 'Saldo inicial' },
  { id: 'MOV-0004', equipmentId: 'EQ-0004', type: 'Saída', quantity: 1, date: '2026-10-20', responsible: 'Atendente', reason: 'Entrega para colaborador' },
  { id: 'MOV-0003', equipmentId: 'EQ-0004', type: 'Entrada', quantity: 6, date: '2026-10-19', responsible: 'Administrador', reason: 'Compra de equipamentos' },
  { id: 'MOV-0002', equipmentId: 'EQ-0003', type: 'Saída', quantity: 1, date: '2026-10-18', responsible: 'Atendente', reason: 'Reposição de estação' },
  { id: 'MOV-0001', equipmentId: 'EQ-0003', type: 'Entrada', quantity: 3, date: '2026-10-17', responsible: 'Administrador', reason: 'Saldo inicial' }
];
let inventory = loadData(INVENTORY_KEY, starterInventory);
let movements = loadData(MOVEMENTS_KEY, starterMovements);
let people = loadData(PEOPLE_KEY, []);
let currentUser = loadSession();
let activeView = 'inicio';
let editingEquipmentId = null;
let movementEquipmentId = '';
let deliveryPersonId = '';
let cameraStream = null;
let toastTimer;

function loadData(key, fallback) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : fallback;
  } catch {
    return fallback;
  }
}
function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
}
function saveData() {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements));
  localStorage.setItem(PEOPLE_KEY, JSON.stringify(people));
  updateCounts();
}
function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function formatDate(value) {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}
function canAdmin() { return currentUser?.role === 'Administrador'; }
function updateCounts() {
  document.querySelector('#nav-machine-count').textContent = inventory.length;
  document.querySelector('#nav-movement-count').textContent = movements.length;
  document.querySelector('#nav-people-count').textContent = people.length;
}
function showLogin() {
  document.querySelector('#login-screen').hidden = false;
  document.querySelector('.app-shell').hidden = true;
  document.querySelector('#login-screen').innerHTML = `<main class="login-layout"><section class="login-brand-panel"><a class="login-brand" href="#"><span class="brand-mark">S</span><span><strong>SAUS</strong><small>ATENDIMENTO AO USUÁRIO</small></span></a><div class="login-art fab-scene"><div class="art-label">INSPIRADO NO GRIPEN · FORÇA AÉREA BRASILEIRA</div><div class="fab-radar radar-one"></div><div class="fab-radar radar-two"></div><div class="fab-route"></div><div class="fab-aircraft" aria-hidden="true"><svg viewBox="0 0 520 380" role="img"><path class="aircraft-body" d="M260 20 276 71 279 126 453 248 470 279 282 221 274 307 318 349 317 364 260 347 203 364 202 349 246 307 238 221 50 279 67 248 241 126 244 71Z"/><path class="aircraft-canards" d="m244 111-85 39 5 11 80-20Zm32 0 85 39-5 11-80-20Z"/><path class="aircraft-cockpit" d="m260 44 12 67-12 14-12-14Z"/><path class="aircraft-detail" d="m260 134 5 73-5 8-5-8Zm-12 173-29 39 41-10Zm24 0 29 39-41-10Z"/><path class="aircraft-mark" d="m91 259 37-25 15 5-37 25Zm338 0-37-25-15 5 37 25Z"/></svg></div><div class="fab-color-mark" aria-label="Cores do Brasil"><i></i><i></i><i></i></div><div class="art-caption"><strong>Servir e apoiar,<br>sempre em frente.</strong><span>Tecnologia e atendimento a quem mantém o Brasil em voo.</span></div></div><div class="login-brand-foot">ATENDIMENTO AO USUÁRIO <span>•</span> FORÇA AÉREA BRASILEIRA</div></section><section class="login-form-panel"><div class="login-form-wrap"><div class="login-mobile-brand"><span class="brand-mark">S</span><strong>SAUS</strong></div><p class="eyebrow">ACESSO AO SISTEMA</p><h1>Bem-vindo</h1><p class="login-subtitle">Entre com seu usuário e senha para continuar.</p><form id="login-form"><label class="login-field"><span>Usuário</span><input name="username" autocomplete="username" placeholder="Digite seu usuário" required autofocus></label><label class="login-field"><span>Senha</span><input name="password" type="password" autocomplete="current-password" placeholder="Digite sua senha" required></label><p class="login-error" id="login-error" role="alert"></p><button class="primary-button login-submit" type="submit">Entrar <span>→</span></button></form><div class="login-accounts"><strong>Acessos para demonstração</strong><span>Administrador: <code>admin</code> / <code>SAUS2026</code></span><span>Atendente: <code>atendente</code> / <code>SAUS2026</code></span></div><p class="login-disclaimer">Acesso demonstrativo neste navegador. Para uso real, a autenticação precisa de um servidor seguro.</p></div></section></main>`;
  document.querySelector('#login-form').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const username = String(data.get('username')).trim().toLowerCase();
    const account = accounts[username];
    if (!account || account.password !== data.get('password')) {
      document.querySelector('#login-error').textContent = 'Usuário ou senha incorretos.';
      return;
    }
    currentUser = { username, name: account.name, role: account.role };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    startApp();
  });
}
function startApp() {
  if (!currentUser || !['Administrador', 'Atendente'].includes(currentUser.role)) {
    currentUser = null;
    sessionStorage.removeItem(SESSION_KEY);
    showLogin();
    return;
  }
  document.querySelector('#login-screen').hidden = true;
  document.querySelector('.app-shell').hidden = false;
  document.querySelector('#profile-name').textContent = currentUser.name;
  document.querySelector('#profile-role').textContent = currentUser.role;
  document.querySelector('#profile-initials').textContent = currentUser.role === 'Administrador' ? 'AD' : 'AT';
  document.querySelector('#top-avatar').textContent = currentUser.role === 'Administrador' ? 'AD' : 'AT';
  document.querySelectorAll('[data-admin-only]').forEach(element => { element.hidden = !canAdmin(); });
  document.querySelector('#today-label').textContent = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(today);
  updateCounts();
  setView(location.hash.slice(1) || 'inicio');
}
function setView(view) {
  const allowed = ['inicio', 'equipamentos', 'movimentacoes', 'cadastro', 'nova-movimentacao', 'entregas', 'nova-entrega', 'relatorios'];
  if (!allowed.includes(view) || (view === 'relatorios' && !canAdmin())) view = 'inicio';
  activeView = view;
  const labels = { inicio: 'Visão geral', equipamentos: 'Equipamentos', movimentacoes: 'Movimentações', cadastro: 'Cadastrar equipamento', 'nova-movimentacao': 'Nova movimentação', entregas: 'Entregas', 'nova-entrega': 'Nova entrega', relatorios: 'Relatórios' };
  document.querySelector('#breadcrumb-current').textContent = labels[view];
  navLinks.forEach(link => link.classList.toggle('active', link.dataset.view === view || (['cadastro'].includes(view) && link.dataset.view === 'equipamentos') || (view === 'nova-movimentacao' && link.dataset.view === 'movimentacoes') || (view === 'nova-entrega' && link.dataset.view === 'entregas')));
  document.querySelector('#sidebar').classList.remove('open');
  stopCamera();
  if (view === 'inicio') renderDashboard();
  if (view === 'equipamentos') renderInventory();
  if (view === 'movimentacoes') renderMovements();
  if (view === 'cadastro') renderEquipmentForm(getEquipment(editingEquipmentId));
  if (view === 'nova-movimentacao') { renderMovementForm(movementEquipmentId); movementEquipmentId = ''; }
  if (view === 'entregas') renderDeliveries();
  if (view === 'nova-entrega') { renderDeliveryForm(deliveryPersonId); deliveryPersonId = ''; }
  if (view === 'relatorios') renderReports();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function go(view) {
  if (location.hash !== `#${view}`) location.hash = view;
  else setView(view);
}
function stockStatus(quantity, minimum) {
  return quantity <= minimum ? '<span class="status-pill low-stock">Estoque baixo</span>' : '<span class="status-pill">Disponível</span>';
}
function equipmentIcon(category = '') {
  return ({ Monitores: '▣', Computadores: '▤', Energia: 'ϟ', Periféricos: '⌨', Impressoras: '▧', Rede: '⌁', Outros: '▦' })[category] || '▦';
}
function equipmentCell(item) {
  return `<div class="machine-name"><span class="machine-thumb">${equipmentIcon(item.category)}</span><span>${escapeHtml(item.name || 'Equipamento sem nome')}<small>${escapeHtml(item.brand)} ${escapeHtml(item.model)}</small></span></div>`;
}
function getEquipment(id) { return inventory.find(item => item.id === id); }
function movementLabel(type) {
  return type === 'Entrada' ? '<span class="movement-tag entry">↑ Entrada</span>' : '<span class="movement-tag exit">↓ Saída</span>';
}
function renderDashboard() {
  const totalUnits = inventory.reduce((sum, item) => sum + Number(item.quantity), 0);
  const lowStock = inventory.filter(item => Number(item.quantity) <= Number(item.minimum)).length;
  const todayMoves = movements.filter(move => move.date === localDate()).length;
  page.innerHTML = `<section class="page-heading"><div><p class="eyebrow">${new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(today).toLocaleUpperCase('pt-BR')} · ${formatDate(localDate(today))}</p><h1>Olá, ${escapeHtml(currentUser.name)}</h1><p class="heading-subtitle">Resumo do inventário de equipamentos de informática.</p></div><button class="primary-button" data-action="new-movement"><span class="plus">＋</span> Registrar movimentação</button></section><section class="kpi-grid" aria-label="Indicadores"><article class="kpi-card"><div class="kpi-top"><span>Tipos cadastrados</span><span class="kpi-icon">▦</span></div><div class="kpi-value">${String(inventory.length).padStart(2, '0')}</div><div class="kpi-note">Itens diferentes no inventário</div></article><article class="kpi-card"><div class="kpi-top"><span>Unidades em estoque</span><span class="kpi-icon blue">▤</span></div><div class="kpi-value">${String(totalUnits).padStart(2, '0')}</div><div class="kpi-note">Saldo atual de equipamentos</div></article><article class="kpi-card"><div class="kpi-top"><span>Movimentações hoje</span><span class="kpi-icon orange">↕</span></div><div class="kpi-value">${String(todayMoves).padStart(2, '0')}</div><div class="kpi-note">Entradas e saídas registradas</div></article><article class="kpi-card"><div class="kpi-top"><span>Estoque baixo</span><span class="kpi-icon red">!</span></div><div class="kpi-value">${String(lowStock).padStart(2, '0')}</div><div class="kpi-note">Itens no mínimo ou abaixo dele</div></article></section><section class="dashboard-grid"><article class="panel"><header class="panel-header"><div><h2 class="panel-title">Últimas movimentações</h2><p class="panel-caption">Entradas e saídas recentes do inventário</p></div><a class="text-link" href="#movimentacoes" data-view="movimentacoes">Ver histórico →</a></header>${renderMovementTable(movements.slice(0, 5), true)}</article><article class="panel"><header class="panel-header"><div><h2 class="panel-title">Atenção ao estoque</h2><p class="panel-caption">Itens no mínimo ou abaixo do limite</p></div><a class="text-link" href="#equipamentos" data-view="equipamentos">Ver itens →</a></header><div class="activity-list">${inventory.filter(item => Number(item.quantity) <= Number(item.minimum)).map(item => `<div class="activity-item"><span class="activity-icon warn">!</span><div class="activity-copy"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.id)} · Mínimo ${item.minimum} un.</small></div><span class="activity-time">${item.quantity} un.</span></div>`).join('') || '<div class="empty-state"><strong>Estoque em dia</strong>Nenhum item está abaixo do mínimo.</div>'}</div></article></section>`;
}
function renderMovementTable(rows, compact = false) {
  if (!rows.length) return '<div class="empty-state"><strong>Nenhuma movimentação</strong>Os registros de entrada e saída aparecerão aqui.</div>';
  return `<div class="table-wrap"><table><thead><tr><th>TIPO</th><th>EQUIPAMENTO</th><th>QUANTIDADE</th><th>RESPONSÁVEL</th><th>DATA</th>${compact ? '' : '<th>MOTIVO</th>'}</tr></thead><tbody>${rows.map(move => { const item = getEquipment(move.equipmentId); return `<tr><td>${movementLabel(move.type)}</td><td><div class="table-item">${escapeHtml(item?.name || 'Equipamento removido')}<small>${escapeHtml(move.equipmentId)}</small></div></td><td class="mono">${move.quantity} un.</td><td>${escapeHtml(move.responsible)}</td><td class="mono">${formatDate(move.date)}</td>${compact ? '' : `<td>${escapeHtml(move.reason || '—')}</td>`}</tr>`; }).join('')}</tbody></table></div>`;
}
function renderInventory() {
  page.innerHTML = `<section class="page-heading"><div><p class="eyebrow">PATRIMÔNIO · ${inventory.length} TIPOS CADASTRADOS</p><h1>Equipamentos</h1><p class="heading-subtitle">Monitores, computadores, estabilizadores e outros itens de TI.</p></div><button class="primary-button" data-action="new-equipment"><span class="plus">＋</span> Cadastrar equipamento</button></section><section class="panel content-panel"><div class="toolbar"><label class="search-box"><span>⌕</span><input id="inventory-search" type="search" placeholder="Buscar item, marca ou identificação" aria-label="Buscar equipamentos"></label><select id="inventory-category" aria-label="Filtrar categoria"><option value="">Todas as categorias</option>${[...new Set(inventory.map(item => item.category))].sort().map(category => `<option>${escapeHtml(category)}</option>`).join('')}</select><span class="result-count" id="inventory-result-count"></span></div><div class="table-wrap"><table><thead><tr><th>EQUIPAMENTO</th><th>CÓDIGO</th><th>CATEGORIA</th><th>ESTOQUE</th><th>STATUS</th><th>LOCAL</th><th>AÇÃO</th></tr></thead><tbody id="inventory-rows"></tbody></table></div><div class="table-footer"><span id="inventory-summary"></span><span>Saldo atualizado pelas movimentações</span></div></section>`;
  renderInventoryRows();
  document.querySelector('#inventory-search').addEventListener('input', renderInventoryRows);
  document.querySelector('#inventory-category').addEventListener('change', renderInventoryRows);
}
function renderInventoryRows() {
  const query = document.querySelector('#inventory-search').value.trim().toLocaleLowerCase('pt-BR');
  const category = document.querySelector('#inventory-category').value;
  const items = inventory.filter(item => [item.id, item.name, item.category, item.brand, item.model, item.serial, item.bmp, item.sau].some(value => String(value || '').toLocaleLowerCase('pt-BR').includes(query)) && (!category || item.category === category));
  document.querySelector('#inventory-rows').innerHTML = items.length ? items.map(item => `<tr data-equipment-id="${escapeHtml(item.id)}"><td>${equipmentCell(item)}</td><td class="mono">${escapeHtml(item.id)}</td><td>${escapeHtml(item.category)}</td><td class="mono">${item.quantity} un.</td><td>${stockStatus(Number(item.quantity), Number(item.minimum))}</td><td>${escapeHtml(item.location || '—')}</td><td><button class="table-action" data-action="new-movement" data-id="${escapeHtml(item.id)}" title="Registrar entrada ou saída">＋/−</button>${canAdmin() ? `<button class="table-action" data-action="edit-equipment" data-id="${escapeHtml(item.id)}" title="Editar equipamento">✎</button>` : ''}</td></tr>`).join('') : '<tr><td colspan="7"><div class="empty-state"><strong>Nenhum equipamento encontrado</strong>Cadastre um item ou altere os filtros.</div></td></tr>';
  document.querySelector('#inventory-result-count').textContent = `${items.length} resultado${items.length === 1 ? '' : 's'}`;
  document.querySelector('#inventory-summary').textContent = `Exibindo ${items.length} de ${inventory.length} tipos de equipamento`;
}
function renderEquipmentForm(item = null) {
  const editing = Boolean(item);
  const stockSection = editing
    ? `<section class="form-section"><div class="form-section-heading"><span class="section-number">02</span><div><h2>Controle de estoque</h2><p>O saldo é atualizado pelas movimentações.</p></div></div><div class="form-grid"><div class="form-field"><label for="equipment-quantity">Quantidade atual</label><input id="equipment-quantity" name="quantity" type="number" min="0" step="1" readonly value="${escapeHtml(item.quantity)}"></div><div class="form-field"><label for="equipment-minimum">Estoque mínimo</label><input id="equipment-minimum" name="minimum" type="number" min="0" step="1" value="${escapeHtml(item.minimum ?? 1)}"></div></div></section>`
    : '';
  const recipientSection = editing
    ? ''
    : `<section class="form-section"><div class="form-section-heading"><span class="section-number">02</span><div><h2>Responsável que receberá o equipamento</h2><p>Preencha esta parte para entregar uma unidade agora. Os dados ficam salvos para próximas entregas.</p></div></div><div class="recipient-layout"><div class="form-grid"><div class="form-field full"><label for="recipient-name">Nome completo</label><input id="recipient-name" name="recipientName" maxlength="90" placeholder="Nome de quem receberá o equipamento"></div><div class="form-field"><label for="recipient-sector">Setor</label><input id="recipient-sector" name="recipientSector" maxlength="60" placeholder="Ex.: Recursos Humanos"></div><div class="form-field"><label for="recipient-extension">Ramal</label><input id="recipient-extension" name="recipientExtension" maxlength="15" placeholder="Ex.: 204"></div></div><div class="photo-capture"><div class="photo-frame"><img id="recipient-photo-preview" alt="Prévia da foto 3 por 4" hidden><video id="recipient-camera" autoplay playsinline hidden></video><span id="photo-placeholder">Foto 3×4</span></div><div class="photo-actions"><button class="secondary-button" type="button" data-action="start-camera">Abrir câmera</button><button class="secondary-button" type="button" data-action="capture-photo" hidden>Tirar foto</button><label class="photo-upload secondary-button" for="recipient-photo-file">Enviar foto</label><input id="recipient-photo-file" type="file" accept="image/*" hidden></div><small id="camera-status" class="field-hint">A câmera pode exigir permissão do navegador e conexão segura.</small></div></div><p class="field-hint">Ao preencher o responsável, uma unidade será retirada do estoque e vinculada a ele; o saldo restante continuará disponível.</p></section>`;
  page.innerHTML = `<section class="page-heading"><div><p class="eyebrow">INVENTÁRIO · ${editing ? 'EDIÇÃO' : 'NOVO ITEM'}</p><h1>${editing ? 'Editar equipamento' : 'Cadastrar equipamento'}</h1><p class="heading-subtitle">Informe os dados do item e a quantidade disponível.</p></div><button class="secondary-button" data-action="back-inventory">← Voltar para equipamentos</button></section><form id="equipment-form" class="form-layout"><div class="panel form-main"><section class="form-section"><div class="form-section-heading"><span class="section-number">01</span><div><h2>Identificação do equipamento</h2><p>Modelo, categoria, BMP, SAU e marca são obrigatórios.</p></div></div><div class="form-grid"><div class="form-field"><label for="equipment-name">Nome da máquina</label><input id="equipment-name" name="name" maxlength="70" placeholder="Opcional" value="${escapeHtml(item?.name || '')}"></div><div class="form-field"><label for="equipment-category">Categoria <span>*</span></label><select id="equipment-category" name="category" ${editing ? '' : 'required'}>${['Monitores', 'Computadores', 'Energia', 'Periféricos', 'Impressoras', 'Rede', 'Outros'].map(option => `<option ${item?.category === option ? 'selected' : ''}>${option}</option>`).join('')}</select></div><div class="form-field"><label for="equipment-model">Modelo <span>*</span></label><input id="equipment-model" name="model" ${editing ? '' : 'required'} maxlength="50" placeholder="Ex.: P2422H" value="${escapeHtml(item?.model || '')}"></div><div class="form-field"><label for="equipment-brand">Marca <span>*</span></label><input id="equipment-brand" name="brand" ${editing ? '' : 'required'} maxlength="50" placeholder="Ex.: Dell" value="${escapeHtml(item?.brand || '')}"></div><div class="form-field"><label for="equipment-bmp">BMP <span>*</span></label><input id="equipment-bmp" name="bmp" ${editing ? '' : 'required'} maxlength="60" value="${escapeHtml(item?.bmp || '')}"></div><div class="form-field"><label for="equipment-sau">SAU <span>*</span></label><input id="equipment-sau" name="sau" ${editing ? '' : 'required'} maxlength="60" value="${escapeHtml(item?.sau || '')}"></div><div class="form-field full"><label for="equipment-notes">Observações</label><textarea id="equipment-notes" name="notes" maxlength="500" placeholder="Opcional">${escapeHtml(item?.notes || '')}</textarea></div></div></section>${stockSection}${recipientSection}<div class="form-actions"><button class="secondary-button" type="button" data-action="back-inventory">Cancelar</button><button class="primary-button" type="submit">${editing ? 'Salvar alterações' : 'Cadastrar equipamento'}</button></div></div><aside class="form-aside"><article class="aside-card"><span class="aside-mark">▤</span><h3>Saldo rastreável</h3><p>Entradas e saídas ficam no histórico. O saldo é atualizado automaticamente após cada registro.</p></article><article class="aside-card"><h3>Tipos comuns</h3><div class="tip-line"><span>✓</span> Computadores, monitores e notebooks</div><div class="tip-line"><span>✓</span> Estabilizadores, teclados e periféricos</div></article></aside></form>`;
  document.querySelector('#equipment-form').addEventListener('submit', event => saveEquipment(event, item?.id));
  if (!editing) {
    const formMain = document.querySelector('#equipment-form .form-main');
    const recipientSection = document.querySelector('#recipient-name').closest('.form-section');
    formMain.insertBefore(recipientSection, formMain.querySelector('.form-section'));
    formMain.querySelectorAll('.form-section .section-number').forEach((number, index) => {
      number.textContent = String(index + 1).padStart(2, '0');
    });
    const recipientDetails = recipientSection.querySelector('.recipient-layout');
    const personPicker = document.createElement('div');
    personPicker.className = 'form-field recipient-person-picker';
    personPicker.innerHTML = '<label for="recipient-person">Pessoa que receberá</label><select id="recipient-person" name="recipientId"><option value="">Cadastrar novo responsável</option></select>';
    const personSelect = personPicker.querySelector('select');
    people.forEach(person => {
      const option = document.createElement('option');
      option.value = person.id;
      option.textContent = `${person.name} · ${person.sector}`;
      personSelect.append(option);
    });
    recipientSection.insertBefore(personPicker, recipientDetails);
    const selectedPerson = document.createElement('div');
    selectedPerson.className = 'delivery-person-summary';
    selectedPerson.hidden = true;
    recipientSection.insertBefore(selectedPerson, recipientDetails);
    personSelect.addEventListener('change', () => {
      personSelect.setCustomValidity('');
      const person = getPerson(personSelect.value);
      recipientDetails.hidden = Boolean(person);
      selectedPerson.hidden = !person;
      selectedPerson.replaceChildren();
      if (person) {
        if (person.photo) {
          const photo = document.createElement('img');
          photo.className = 'person-photo';
          photo.src = person.photo;
          photo.alt = `Foto 3 por 4 de ${person.name}`;
          selectedPerson.append(photo);
        }
        const details = document.createElement('div');
        const name = document.createElement('strong');
        name.textContent = person.name;
        const description = document.createElement('small');
        description.textContent = `${person.sector} · Ramal ${person.extension}`;
        details.append(name, description);
        selectedPerson.append(details);
      }
    });
    document.querySelector('#recipient-photo-file').addEventListener('change', loadRecipientPhoto);
    ['recipientName', 'recipientSector', 'recipientExtension'].forEach(name => {
      document.querySelector(`[name="${name}"]`).addEventListener('input', event => event.currentTarget.setCustomValidity(''));
    });
    const actions = document.querySelector('#equipment-form .form-actions');
    const addMachineButton = document.createElement('button');
    addMachineButton.type = 'button';
    addMachineButton.className = 'secondary-button';
    addMachineButton.dataset.action = 'add-machine-entry';
    addMachineButton.textContent = '＋ Cadastrar mais uma máquina';
    actions.insertBefore(addMachineButton, actions.lastElementChild);
  }
}
function addMachineEntry() {
  const sections = [...document.querySelectorAll('#equipment-form [data-additional-machine]')];
  const machineNumber = sections.reduce((max, section) => Math.max(max, Number(section.dataset.machineIndex)), 1) + 1;
  const prefix = `machine-${machineNumber}`;
  const section = document.createElement('section');
  section.className = 'form-section additional-machine-section';
  section.dataset.additionalMachine = '';
  section.dataset.machineIndex = machineNumber;
  section.innerHTML = `<div class="form-section-heading"><span class="section-number">02</span><div><h2>Máquina adicional</h2><p>Preencha os dados desta outra máquina; cada bloco será cadastrado como um equipamento separado.</p></div><button class="icon-button remove-machine-button" type="button" data-action="remove-machine-entry" aria-label="Remover máquina adicional" title="Remover máquina">×</button></div><div class="form-grid"><div class="form-field"><label for="${prefix}-name">Nome da máquina</label><input id="${prefix}-name" name="${prefix}-name" maxlength="70" placeholder="Opcional"></div><div class="form-field"><label for="${prefix}-category">Categoria <span>*</span></label><select id="${prefix}-category" name="${prefix}-category" required><option value="Monitores">Monitores</option><option value="Computadores">Computadores</option><option value="Energia">Energia</option><option value="Periféricos">Periféricos</option><option value="Impressoras">Impressoras</option><option value="Rede">Rede</option><option value="Outros">Outros</option></select></div><div class="form-field"><label for="${prefix}-model">Modelo <span>*</span></label><input id="${prefix}-model" name="${prefix}-model" required maxlength="50" placeholder="Ex.: P2422H"></div><div class="form-field"><label for="${prefix}-brand">Marca <span>*</span></label><input id="${prefix}-brand" name="${prefix}-brand" required maxlength="50" placeholder="Ex.: Dell"></div><div class="form-field"><label for="${prefix}-bmp">BMP <span>*</span></label><input id="${prefix}-bmp" name="${prefix}-bmp" required maxlength="60"></div><div class="form-field"><label for="${prefix}-sau">SAU <span>*</span></label><input id="${prefix}-sau" name="${prefix}-sau" required maxlength="60"></div><div class="form-field full"><label for="${prefix}-notes">Observações</label><textarea id="${prefix}-notes" name="${prefix}-notes" maxlength="500" placeholder="Opcional"></textarea></div></div>`;
  const lastMachineSection = sections.at(-1) || document.querySelector('#equipment-name').closest('.form-section');
  lastMachineSection.after(section);
  section.querySelector('input').focus();
}
function saveEquipment(event, existingId) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const item = Object.fromEntries(formData.entries());
  for (const key of formData.keys()) {
    if (key.startsWith('machine-')) delete item[key];
  }
  item.quantity = Number(item.quantity ?? 1);
  item.minimum = Number(item.minimum ?? 1);
  const additionalMachines = [...document.querySelectorAll('#equipment-form [data-additional-machine]')].map(section => {
    const prefix = `machine-${section.dataset.machineIndex}`;
    return {
      name: String(formData.get(`${prefix}-name`) || '').trim(),
      category: String(formData.get(`${prefix}-category`) || ''),
      brand: String(formData.get(`${prefix}-brand`) || ''),
      model: String(formData.get(`${prefix}-model`) || ''),
      bmp: String(formData.get(`${prefix}-bmp`) || '').trim(),
      sau: String(formData.get(`${prefix}-sau`) || '').trim(),
      notes: String(formData.get(`${prefix}-notes`) || ''),
      quantity: 1,
      minimum: 1
    };
  });
  const recipientName = String(item.recipientName || '').trim();
  const recipientSector = String(item.recipientSector || '').trim();
  const recipientExtension = String(item.recipientExtension || '').trim();
  const selectedRecipientId = String(item.recipientId || '');
  let recipient = selectedRecipientId ? getPerson(selectedRecipientId) : null;
  const hasNewRecipientDetails = Boolean(recipientName || recipientSector || recipientExtension);
  const hasRecipientDetails = Boolean(recipient || hasNewRecipientDetails);
  delete item.recipientName;
  delete item.recipientSector;
  delete item.recipientExtension;
  delete item.recipientId;
  if (!existingId && selectedRecipientId && !recipient) {
    const personSelect = document.querySelector('#recipient-person');
    personSelect.setCustomValidity('Selecione uma pessoa cadastrada ou cadastre um novo responsável.');
    personSelect.reportValidity();
    return;
  }
  if (!existingId && !recipient && hasNewRecipientDetails && (!recipientName || !recipientSector || !recipientExtension)) {
    for (const [fieldName, value] of [['recipientName', recipientName], ['recipientSector', recipientSector], ['recipientExtension', recipientExtension]]) {
      const field = document.querySelector(`[name="${fieldName}"]`);
      field.setCustomValidity(value ? '' : 'Preencha todos os dados do responsável ou deixe esta seção em branco.');
    }
    event.currentTarget.reportValidity();
    return;
  }
  if (!existingId && hasRecipientDetails && item.quantity < 1) {
    const quantityInput = document.querySelector('#equipment-quantity');
    quantityInput.setCustomValidity('Informe ao menos uma unidade para registrar a entrega ao responsável.');
    quantityInput.reportValidity();
    quantityInput.addEventListener('input', () => quantityInput.setCustomValidity(''), { once: true });
    return;
  }
  if (existingId) {
    inventory = inventory.map(existing => existing.id === existingId ? { ...existing, ...item } : existing);
  } else {
    const nextId = inventory.reduce((max, equipment) => Math.max(max, Number(equipment.id.replace(/\D/g, '')) || 0), 0) + 1;
    item.id = `EQ-${String(nextId).padStart(4, '0')}`;
    inventory.unshift(item);
    if (item.quantity > 0) movements.unshift({ id: nextMovementId(), equipmentId: item.id, type: 'Entrada', quantity: item.quantity, date: localDate(), responsible: currentUser.name, reason: 'Cadastro inicial' });
    const createdItems = [item];
    additionalMachines.forEach(machine => {
      const nextMachineId = inventory.reduce((max, equipment) => Math.max(max, Number(equipment.id.replace(/\D/g, '')) || 0), 0) + 1;
      machine.id = `EQ-${String(nextMachineId).padStart(4, '0')}`;
      inventory.unshift(machine);
      movements.unshift({ id: nextMovementId(), equipmentId: machine.id, type: 'Entrada', quantity: 1, date: localDate(), responsible: currentUser.name, reason: 'Cadastro inicial' });
      createdItems.push(machine);
    });
    if (hasNewRecipientDetails) {
      recipient = {
        id: nextPersonId(),
        name: recipientName,
        sector: recipientSector,
        extension: recipientExtension,
        photo: document.querySelector('#recipient-photo-preview').getAttribute('src') || ''
      };
      people.unshift(recipient);
    }
    if (hasRecipientDetails) {
      createdItems.forEach(createdItem => {
        createdItem.quantity -= 1;
        movements.unshift({ id: nextMovementId(), equipmentId: createdItem.id, type: 'Saída', quantity: 1, date: localDate(), responsible: currentUser.name, reason: `Entrega para ${recipient.name}`, recipientId: recipient.id });
      });
    }
  }
  saveData();
  editingEquipmentId = null;
  showToast(existingId ? 'Equipamento atualizado.' : hasRecipientDetails ? `${additionalMachines.length + 1} máquina(s) cadastrada(s) e entregue(s) para ${recipient.name}.` : `${additionalMachines.length + 1} máquina(s) cadastrada(s) e entrada(s) registrada(s).`);
  go('equipamentos');
}
function nextMovementId() {
  const max = movements.reduce((value, move) => Math.max(value, Number(move.id.replace(/\D/g, '')) || 0), 0) + 1;
  return `MOV-${String(max).padStart(4, '0')}`;
}
function renderMovementForm(equipmentId = '', type = 'Entrada') {
  const available = equipmentId ? getEquipment(equipmentId) : null;
  page.innerHTML = `<section class="page-heading"><div><p class="eyebrow">ESTOQUE · NOVO REGISTRO</p><h1>Registrar movimentação</h1><p class="heading-subtitle">Toda entrada ou saída atualiza o saldo do equipamento.</p></div><button class="secondary-button" data-action="back-movements">← Voltar para movimentações</button></section><form id="movement-form" class="form-layout"><div class="panel form-main"><section class="form-section"><div class="form-section-heading"><span class="section-number">01</span><div><h2>Dados da movimentação</h2><p>Preencha os dados para manter o histórico atualizado.</p></div></div><div class="form-grid"><div class="form-field"><label for="movement-type">Tipo <span>*</span></label><select id="movement-type" name="type" required><option ${type === 'Entrada' ? 'selected' : ''}>Entrada</option><option ${type === 'Saída' ? 'selected' : ''}>Saída</option></select></div><div class="form-field"><label for="movement-equipment">Equipamento <span>*</span></label><select id="movement-equipment" name="equipmentId" required><option value="">Selecione o equipamento</option>${inventory.map(item => `<option value="${escapeHtml(item.id)}" ${item.id === equipmentId ? 'selected' : ''}>${escapeHtml(item.name)} · ${escapeHtml(item.id)} (${item.quantity} un.)</option>`).join('')}</select></div><div class="form-field"><label for="movement-quantity">Quantidade <span>*</span></label><input id="movement-quantity" name="quantity" type="number" min="1" step="1" required value="1"><small class="field-hint" id="stock-hint">Saldo disponível: ${available?.quantity ?? '—'} un.</small></div><div class="form-field"><label for="movement-date">Data <span>*</span></label><input id="movement-date" name="date" type="date" required value="${localDate()}"></div><div class="form-field"><label for="movement-responsible">Responsável <span>*</span></label><input id="movement-responsible" name="responsible" required maxlength="70" value="${escapeHtml(currentUser.name)}"></div><div class="form-field"><label for="movement-reason">Motivo</label><input id="movement-reason" name="reason" maxlength="120" placeholder="Ex.: Entrega para colaborador"></div></div></section><div class="form-actions"><button class="secondary-button" type="button" data-action="back-movements">Cancelar</button><button class="primary-button" type="submit">Salvar movimentação</button></div></div><aside class="form-aside"><article class="aside-card"><span class="aside-mark">↕</span><h3>Saldo atualizado</h3><p>Saídas acima do saldo disponível são bloqueadas. A movimentação registrada fica no histórico para consulta.</p></article></aside></form>`;
  const equipmentSelect = document.querySelector('#movement-equipment');
  const typeSelect = document.querySelector('#movement-type');
  const quantityInput = document.querySelector('#movement-quantity');
  function updateStockHint() {
    const selected = getEquipment(equipmentSelect.value);
    document.querySelector('#stock-hint').textContent = `Saldo disponível: ${selected?.quantity ?? 0} un.`;
    quantityInput.max = typeSelect.value === 'Saída' ? String(selected?.quantity ?? 0) : '';
  }
  equipmentSelect.addEventListener('change', updateStockHint);
  typeSelect.addEventListener('change', updateStockHint);
  updateStockHint();
  document.querySelector('#movement-form').addEventListener('submit', saveMovement);
}
function saveMovement(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const item = getEquipment(data.equipmentId);
  const quantity = Number(data.quantity);
  if (!item || quantity < 1 || (data.type === 'Saída' && quantity > Number(item.quantity))) {
    document.querySelector('#movement-quantity').setCustomValidity('A quantidade informada excede o saldo disponível.');
    document.querySelector('#movement-quantity').reportValidity();
    document.querySelector('#movement-quantity').addEventListener('input', event => event.currentTarget.setCustomValidity(''), { once: true });
    return;
  }
  item.quantity = Number(item.quantity) + (data.type === 'Entrada' ? quantity : -quantity);
  movements.unshift({ ...data, id: nextMovementId(), quantity, responsible: data.responsible.trim() });
  saveData();
  showToast(`${data.type} registrada com sucesso.`);
  go('movimentacoes');
}
function renderMovements() {
  page.innerHTML = `<section class="page-heading"><div><p class="eyebrow">HISTÓRICO · ${movements.length} REGISTROS</p><h1>Movimentações</h1><p class="heading-subtitle">Consulte todas as entradas e saídas do inventário.</p></div><button class="primary-button" data-action="new-movement"><span class="plus">＋</span> Nova movimentação</button></section><section class="panel content-panel"><div class="toolbar"><label class="search-box"><span>⌕</span><input id="movement-search" type="search" placeholder="Buscar equipamento ou responsável" aria-label="Buscar movimentações"></label><select id="movement-filter" aria-label="Filtrar tipo"><option value="">Entradas e saídas</option><option>Entrada</option><option>Saída</option></select><span class="result-count" id="movement-result-count"></span></div><div id="movement-table"></div><div class="table-footer"><span id="movement-summary"></span><span>Registro de auditoria do inventário</span></div></section>`;
  renderMovementRows();
  document.querySelector('#movement-search').addEventListener('input', renderMovementRows);
  document.querySelector('#movement-filter').addEventListener('change', renderMovementRows);
}
function renderMovementRows() {
  const query = document.querySelector('#movement-search').value.trim().toLocaleLowerCase('pt-BR');
  const filter = document.querySelector('#movement-filter').value;
  const rows = movements.filter(move => { const item = getEquipment(move.equipmentId); return (!filter || move.type === filter) && [item?.name, item?.brand, item?.model, move.equipmentId, move.responsible, move.reason].some(value => String(value || '').toLocaleLowerCase('pt-BR').includes(query)); });
  document.querySelector('#movement-table').innerHTML = renderMovementTable(rows);
  document.querySelector('#movement-result-count').textContent = `${rows.length} registro${rows.length === 1 ? '' : 's'}`;
  document.querySelector('#movement-summary').textContent = `Exibindo ${rows.length} de ${movements.length} movimentações`;
}
function renderReports() {
  const total = inventory.reduce((sum, item) => sum + Number(item.quantity), 0);
  const entries = movements.filter(move => move.type === 'Entrada').reduce((sum, move) => sum + Number(move.quantity), 0);
  const exits = movements.filter(move => move.type === 'Saída').reduce((sum, move) => sum + Number(move.quantity), 0);
  const groups = [...new Set(inventory.map(item => item.category))];
  page.innerHTML = `<section class="page-heading"><div><p class="eyebrow">ANÁLISE · INVENTÁRIO DE TI</p><h1>Relatórios</h1><p class="heading-subtitle">Resumo do estoque e das movimentações registradas.</p></div><button class="secondary-button" data-action="export">↓ Exportar CSV</button></section><section class="report-grid"><article class="report-card"><small>Unidades em estoque</small><strong>${total}</strong><span>${inventory.length} tipos cadastrados</span></article><article class="report-card"><small>Unidades recebidas</small><strong>${entries}</strong><span>Entradas no histórico</span></article><article class="report-card"><small>Unidades entregues</small><strong>${exits}</strong><span>Saídas no histórico</span></article></section><section class="panel"><header class="panel-header"><div><h2 class="panel-title">Estoque por categoria</h2><p class="panel-caption">Saldo atual de equipamentos em cada grupo</p></div></header><div class="bar-list">${groups.length ? groups.map(category => { const count = inventory.filter(item => item.category === category).reduce((sum, item) => sum + Number(item.quantity), 0); const percent = total ? Math.round(count / total * 100) : 0; return `<div class="bar-row"><span>${escapeHtml(category)}</span><div class="bar-track"><div class="bar-fill" style="width:${percent}%"></div></div><strong>${count}</strong></div>`; }).join('') : '<div class="empty-state"><strong>Sem dados para exibir</strong>Cadastre equipamentos para gerar o relatório.</div>'}</div></section>`;
}
function getPerson(id) { return people.find(person => person.id === id); }
function personInitials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('pt-BR');
}
function renderPersonPhoto(person, className = 'person-photo') {
  return person.photo
    ? `<img class="${className}" src="${escapeHtml(person.photo)}" alt="Foto 3 por 4 de ${escapeHtml(person.name)}">`
    : `<span class="${className} person-photo-placeholder" aria-label="Sem foto">${escapeHtml(personInitials(person.name))}</span>`;
}
function personDeliveries(personId) {
  return movements.filter(move => move.recipientId === personId && move.type === 'Saída');
}
function renderDeliveries() {
  page.innerHTML = `<section class="page-heading"><div><p class="eyebrow">PESSOAS · ${people.length} CADASTRADAS</p><h1>Entregas</h1><p class="heading-subtitle">Cadastre quem recebe os equipamentos e acompanhe as máquinas entregues.</p></div><button class="primary-button" data-action="new-delivery"><span class="plus">＋</span> Nova entrega</button></section><section class="panel content-panel"><div class="toolbar"><label class="search-box"><span>⌕</span><input id="people-search" type="search" placeholder="Buscar por nome, setor ou ramal" aria-label="Buscar pessoas"></label><span class="result-count" id="people-result-count"></span></div><div class="people-list" id="people-list"></div></section>`;
  renderPeopleRows();
  document.querySelector('#people-search').addEventListener('input', renderPeopleRows);
}
function renderPeopleRows() {
  const query = document.querySelector('#people-search').value.trim().toLocaleLowerCase('pt-BR');
  const rows = people.filter(person => [person.name, person.sector, person.extension].some(value => String(value || '').toLocaleLowerCase('pt-BR').includes(query)));
  document.querySelector('#people-result-count').textContent = `${rows.length} pessoa${rows.length === 1 ? '' : 's'}`;
  document.querySelector('#people-list').innerHTML = rows.length ? rows.map(person => {
    const deliveries = personDeliveries(person.id);
    const deliveredUnits = deliveries.reduce((sum, move) => sum + Number(move.quantity), 0);
    const deliveredEquipment = deliveries.map(move => {
      const item = getEquipment(move.equipmentId);
      return `<div class="person-equipment"><span class="machine-thumb">${equipmentIcon(item?.category)}</span><span><strong>${escapeHtml(item?.name || 'Equipamento removido')}</strong><small>${escapeHtml(move.equipmentId)} · ${move.quantity} un. · ${formatDate(move.date)}</small></span></div>`;
    }).join('');
    return `<article class="person-card"><div class="person-card-main">${renderPersonPhoto(person)}<div class="person-info"><h2>${escapeHtml(person.name)}</h2><p>${escapeHtml(person.sector)} · Ramal ${escapeHtml(person.extension)}</p><small>${deliveries.length} entrega${deliveries.length === 1 ? '' : 's'} · ${deliveredUnits} unidade${deliveredUnits === 1 ? '' : 's'}</small></div></div><button class="secondary-button person-add-button" data-action="add-equipment-to-person" data-id="${escapeHtml(person.id)}">＋ Adicionar equipamento</button><div class="person-equipment-list">${deliveredEquipment || '<p class="person-empty">Nenhum equipamento entregue ainda.</p>'}</div></article>`;
  }).join('') : `<div class="empty-state"><strong>${people.length ? 'Nenhuma pessoa encontrada' : 'Nenhuma pessoa cadastrada'}</strong>${people.length ? 'Altere a busca ou cadastre uma nova entrega.' : 'Cadastre a primeira entrega para incluir o responsável e seus equipamentos.'}</div>`;
}
function renderDeliveryForm(personId = '') {
  const person = personId ? getPerson(personId) : null;
  const availableInventory = inventory.filter(item => Number(item.quantity) > 0);
  const options = availableInventory.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} · ${escapeHtml(item.id)} (${item.quantity} un.)</option>`).join('');
  page.innerHTML = `<section class="page-heading"><div><p class="eyebrow">ENTREGAS · ${person ? 'ADICIONAR EQUIPAMENTO' : 'NOVO RESPONSÁVEL'}</p><h1>${person ? 'Adicionar equipamento' : 'Registrar entrega'}</h1><p class="heading-subtitle">${person ? 'Selecione outro equipamento para esta pessoa, sem repetir o cadastro.' : 'Cadastre o responsável e registre o primeiro equipamento entregue.'}</p></div><button class="secondary-button" data-action="back-deliveries">← Voltar para entregas</button></section><form id="delivery-form" class="form-layout"><div class="panel form-main">${person ? `<section class="form-section"><div class="delivery-person-summary">${renderPersonPhoto(person)}<div><strong>${escapeHtml(person.name)}</strong><small>${escapeHtml(person.sector)} · Ramal ${escapeHtml(person.extension)}</small></div></div></section>` : `<section class="form-section"><div class="form-section-heading"><span class="section-number">01</span><div><h2>Dados de quem recebe</h2><p>A foto é opcional e será exibida no enquadramento 3×4.</p></div></div><div class="recipient-layout"><div class="form-grid"><div class="form-field full"><label for="recipient-name">Nome completo <span>*</span></label><input id="recipient-name" name="name" required maxlength="90" placeholder="Nome de quem receberá o equipamento"></div><div class="form-field"><label for="recipient-sector">Setor <span>*</span></label><input id="recipient-sector" name="sector" required maxlength="60" placeholder="Ex.: Recursos Humanos"></div><div class="form-field"><label for="recipient-extension">Ramal <span>*</span></label><input id="recipient-extension" name="extension" required maxlength="15" placeholder="Ex.: 204"></div></div><div class="photo-capture"><div class="photo-frame"><img id="recipient-photo-preview" alt="Prévia da foto 3 por 4" hidden><video id="recipient-camera" autoplay playsinline hidden></video><span id="photo-placeholder">Foto 3×4</span></div><div class="photo-actions"><button class="secondary-button" type="button" data-action="start-camera">Abrir câmera</button><button class="secondary-button" type="button" data-action="capture-photo" hidden>Tirar foto</button><label class="photo-upload secondary-button" for="recipient-photo-file">Enviar foto</label><input id="recipient-photo-file" type="file" accept="image/*" hidden></div><small id="camera-status" class="field-hint">A câmera pode exigir permissão do navegador e conexão segura.</small></div></div></section>`}<section class="form-section"><div class="form-section-heading"><span class="section-number">${person ? '01' : '02'}</span><div><h2>Equipamento entregue</h2><p>A entrega registra uma saída e atualiza o saldo do estoque.</p></div></div><div class="form-grid"><div class="form-field"><label for="delivery-equipment">Equipamento <span>*</span></label><select id="delivery-equipment" name="equipmentId" required><option value="">Selecione o equipamento</option>${options}</select></div><div class="form-field"><label for="delivery-quantity">Quantidade <span>*</span></label><input id="delivery-quantity" name="quantity" type="number" min="1" step="1" value="1" required><small id="delivery-stock-hint" class="field-hint">Saldo disponível: —</small></div></div></section><div class="form-actions"><button class="secondary-button" type="button" data-action="back-deliveries">Cancelar</button><button class="primary-button" type="submit">Registrar entrega</button></div></div><aside class="form-aside"><article class="aside-card"><span class="aside-mark">▣</span><h3>Entrega vinculada</h3><p>O responsável fica associado ao histórico da máquina. Depois, você pode adicionar outros equipamentos sem cadastrar a pessoa novamente.</p></article></aside></form>`;
  const equipmentSelect = document.querySelector('#delivery-equipment');
  const quantityInput = document.querySelector('#delivery-quantity');
  function updateDeliveryStockHint() {
    const selected = getEquipment(equipmentSelect.value);
    document.querySelector('#delivery-stock-hint').textContent = `Saldo disponível: ${selected?.quantity ?? 0} un.`;
    quantityInput.max = String(selected?.quantity ?? 0);
  }
  equipmentSelect.addEventListener('change', updateDeliveryStockHint);
  updateDeliveryStockHint();
  document.querySelector('#delivery-form').addEventListener('submit', event => saveDelivery(event, person?.id));
  if (!person) {
    document.querySelector('#recipient-photo-file').addEventListener('change', loadRecipientPhoto);
  }
}
function saveDelivery(event, personId) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const item = getEquipment(data.equipmentId);
  const quantity = Number(data.quantity);
  if (!item || !Number.isInteger(quantity) || quantity < 1 || quantity > Number(item.quantity)) {
    const input = document.querySelector('#delivery-quantity');
    input.setCustomValidity('A quantidade deve ser um número inteiro dentro do saldo disponível.');
    input.reportValidity();
    input.addEventListener('input', () => input.setCustomValidity(''), { once: true });
    return;
  }
  let person = personId ? getPerson(personId) : null;
  if (!person) {
    person = {
      id: nextPersonId(),
      name: String(data.name).trim(),
      sector: String(data.sector).trim(),
      extension: String(data.extension).trim(),
      photo: document.querySelector('#recipient-photo-preview').getAttribute('src') || ''
    };
    if (!person.photo || person.photo === location.href) person.photo = '';
    people.unshift(person);
  }
  item.quantity = Number(item.quantity) - quantity;
  movements.unshift({
    id: nextMovementId(),
    equipmentId: item.id,
    type: 'Saída',
    quantity,
    date: localDate(),
    responsible: currentUser.name,
    reason: `Entrega para ${person.name}`,
    recipientId: person.id
  });
  saveData();
  showToast(`Entrega registrada para ${person.name}.`);
  go('entregas');
}
function nextPersonId() {
  const max = people.reduce((value, person) => Math.max(value, Number(person.id.replace(/\D/g, '')) || 0), 0) + 1;
  return `USR-${String(max).padStart(4, '0')}`;
}
async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    document.querySelector('#camera-status').textContent = 'Câmera indisponível neste navegador. Envie uma foto existente.';
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    if (activeView !== 'nova-entrega') {
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    cameraStream = stream;
    const video = document.querySelector('#recipient-camera');
    video.srcObject = cameraStream;
    video.hidden = false;
    document.querySelector('#photo-placeholder').hidden = true;
    document.querySelector('[data-action="capture-photo"]').hidden = false;
    document.querySelector('[data-action="start-camera"]').hidden = true;
    document.querySelector('#recipient-photo-preview').hidden = true;
    document.querySelector('#camera-status').textContent = 'Centralize o rosto e tire a foto.';
  } catch (error) {
    document.querySelector('#camera-status').textContent = error.name === 'NotAllowedError'
      ? 'Permita o acesso à câmera no navegador ou envie uma foto existente.'
      : 'Não foi possível abrir a câmera. Envie uma foto existente.';
  }
}
function stopCamera() {
  if (!cameraStream) return;
  cameraStream.getTracks().forEach(track => track.stop());
  cameraStream = null;
}
function cropPhoto(source, width, height) {
  const sourceWidth = source.videoWidth || source.naturalWidth;
  const sourceHeight = source.videoHeight || source.naturalHeight;
  const targetRatio = width / height;
  const sourceRatio = sourceWidth / sourceHeight;
  let sx = 0, sy = 0, sw = sourceWidth, sh = sourceHeight;
  if (sourceRatio > targetRatio) {
    sw = sourceHeight * targetRatio;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / targetRatio;
    sy = (sourceHeight - sh) / 2;
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(source, sx, sy, sw, sh, 0, 0, width, height);
  const preview = document.querySelector('#recipient-photo-preview');
  preview.src = canvas.toDataURL('image/jpeg', .82);
  preview.hidden = false;
  document.querySelector('#photo-placeholder').hidden = true;
  document.querySelector('#recipient-camera').hidden = true;
  document.querySelector('[data-action="capture-photo"]').hidden = true;
  document.querySelector('[data-action="start-camera"]').hidden = false;
  document.querySelector('#camera-status').textContent = 'Foto pronta, em formato 3×4.';
  stopCamera();
}
function capturePhoto() {
  const video = document.querySelector('#recipient-camera');
  if (video.readyState < 2) {
    document.querySelector('#camera-status').textContent = 'Aguarde a câmera ficar pronta para tirar a foto.';
    return;
  }
  cropPhoto(video, 300, 400);
}
function loadRecipientPhoto(event) {
  const file = event.currentTarget.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Selecione um arquivo de imagem.');
    event.currentTarget.value = '';
    return;
  }
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    const image = new Image();
    image.addEventListener('load', () => cropPhoto(image, 300, 400), { once: true });
    image.addEventListener('error', () => showToast('Não foi possível abrir essa imagem.'), { once: true });
    image.src = reader.result;
  }, { once: true });
  reader.addEventListener('error', () => showToast('Não foi possível ler essa imagem.'), { once: true });
  reader.readAsDataURL(file);
}
function openEquipmentDetails(id) {
  const item = getEquipment(id);
  if (!item) return;
  modal.hidden = false;
  modal.innerHTML = `<section class="modal" role="dialog" aria-modal="true"><header class="modal-header"><div><h2>${escapeHtml(item.name || item.model || 'Equipamento')}</h2><p>${escapeHtml(item.id)} · ${escapeHtml(item.category)}</p></div><button class="icon-button" data-action="close-modal" aria-label="Fechar">×</button></header><div class="modal-content"><div class="detail-top"><span class="machine-thumb">${equipmentIcon(item.category)}</span><div><h2>${escapeHtml(item.brand || 'Sem marca')}</h2><p>${escapeHtml(item.model || 'Sem modelo')}</p></div>${stockStatus(Number(item.quantity), Number(item.minimum))}</div><div class="detail-layout">${[['BMP', item.bmp], ['SAU', item.sau], ['Estoque atual', `${item.quantity} unidades`], ['Estoque mínimo', `${item.minimum} unidades`], ['Local', item.location], ['Número de série', item.serial], ['Observações', item.notes]].map(([label, value]) => `<div class="detail-item"><small>${label}</small><strong>${escapeHtml(value || '—')}</strong></div>`).join('')}</div></div><footer class="modal-actions"><button class="secondary-button" data-action="new-movement" data-id="${escapeHtml(item.id)}">Registrar entrada/saída</button><div class="modal-actions-right">${canAdmin() ? `<button class="danger-button" data-action="delete-equipment" data-id="${escapeHtml(item.id)}">Excluir</button><button class="primary-button" data-action="edit-equipment" data-id="${escapeHtml(item.id)}">Editar</button>` : '<button class="secondary-button" data-action="close-modal">Fechar</button>'}</div></footer></section>`;
}
function closeModal() { modal.hidden = true; modal.innerHTML = ''; }
function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}
function exportCsv() {
  const headers = ['Código', 'Equipamento', 'Categoria', 'Marca', 'Modelo', 'BMP', 'SAU', 'Série', 'Quantidade', 'Mínimo', 'Local', 'Observações'];
  const keys = ['id', 'name', 'category', 'brand', 'model', 'bmp', 'sau', 'serial', 'quantity', 'minimum', 'location', 'notes'];
  const rows = inventory.map(item => keys.map(key => `"${String(item[key] || '').replace(/"/g, '""')}"`).join(';'));
  const blob = new Blob(['\ufeff' + [headers.join(';'), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'inventario-saus.csv';
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('Inventário exportado.');
}
document.addEventListener('click', event => {
  const viewLink = event.target.closest('[data-view]');
  if (viewLink) { event.preventDefault(); go(viewLink.dataset.view); return; }
  const action = event.target.closest('[data-action]');
  if (action) {
    const id = action.dataset.id;
    if (action.dataset.action === 'logout') { stopCamera(); currentUser = null; sessionStorage.removeItem(SESSION_KEY); location.hash = ''; showLogin(); return; }
    if (action.dataset.action === 'add-machine-entry') { addMachineEntry(); return; }
    if (action.dataset.action === 'remove-machine-entry') {
      action.closest('[data-additional-machine]').remove();
      return;
    }
    if (action.dataset.action === 'new-equipment') { editingEquipmentId = null; go('cadastro'); return; }
    if (action.dataset.action === 'new-delivery') { deliveryPersonId = ''; go('nova-entrega'); return; }
    if (action.dataset.action === 'add-equipment-to-person') { deliveryPersonId = id; go('nova-entrega'); return; }
    if (action.dataset.action === 'back-deliveries') { go('entregas'); return; }
    if (action.dataset.action === 'start-camera') { startCamera(); return; }
    if (action.dataset.action === 'capture-photo') { capturePhoto(); return; }
    if (action.dataset.action === 'new-movement') { closeModal(); movementEquipmentId = id || ''; go('nova-movimentacao'); return; }
    if (action.dataset.action === 'back-inventory') { editingEquipmentId = null; go('equipamentos'); return; }
    if (action.dataset.action === 'back-movements') { go('movimentacoes'); return; }
    if (action.dataset.action === 'close-modal') { closeModal(); return; }
    if (action.dataset.action === 'edit-equipment' && canAdmin()) { editingEquipmentId = id; closeModal(); go('cadastro'); return; }
    if (action.dataset.action === 'delete-equipment' && canAdmin()) {
      if (window.confirm('Excluir este equipamento? O histórico de movimentações será mantido.')) {
        inventory = inventory.filter(item => item.id !== id); saveData(); closeModal(); setView(activeView); showToast('Equipamento excluído.');
      }
      return;
    }
    if (action.dataset.action === 'export' && canAdmin()) { exportCsv(); return; }
  }
  const row = event.target.closest('[data-equipment-id]');
  if (row) openEquipmentDetails(row.dataset.equipmentId);
  if (event.target === modal) closeModal();
});
document.querySelector('#mobile-menu').addEventListener('click', () => document.querySelector('#sidebar').classList.toggle('open'));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });
window.addEventListener('hashchange', () => { if (currentUser) setView(location.hash.slice(1) || 'inicio'); });
if (currentUser) startApp(); else showLogin();
