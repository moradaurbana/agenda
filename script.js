const API_URL = "https://morada-agenda-e1690e512da6.herokuapp.com";

// --- Funções de Navegação e Carregamento da Página ---
document.addEventListener("DOMContentLoaded", function () {
  const navButtons = document.querySelectorAll(".nav-button");
  const sections = document.querySelectorAll(".page-section");

  // Adiciona listeners aos botões de navegação
  navButtons.forEach(button => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-target");

      sections.forEach(section => section.classList.add("hidden"));
      navButtons.forEach(btn => btn.classList.remove("active"));

      document.getElementById(targetId).classList.remove("hidden");
      button.classList.add("active");
      
      if (targetId === "admin") {
        carregarVisitas();
      }
    });
  });

  inicializarCalendario();
});

// --- Lógica de Agendamento e Calendário ---
const formAgendamento = document.getElementById("form-visita");
formAgendamento.addEventListener("submit", async function (e) {
  e.preventDefault();

  const dados = Object.fromEntries(new FormData(e.target).entries());
  dados.status = "agendada";

  try {
    const res = await fetch(`${API_URL}/visitas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });

    if (res.ok) {
      alert("Visita agendada com sucesso!");
      formAgendamento.reset();
      window.calendario.refetchEvents();
    } else {
      const errorData = await res.json();
      alert(`Erro ao agendar: ${errorData.error || 'Tente novamente.'}`);
    }
  } catch (err) {
    console.error("Erro ao enviar formulário:", err);
    alert("Erro de conexão com o servidor.");
  }
});

function inicializarCalendario() {
  const calendarioEl = document.getElementById('calendario');
  const calendario = new FullCalendar.Calendar(calendarioEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    events: async (fetchInfo, successCallback) => {
      const res = await fetch(`${API_URL}/visitas`);
      const visitas = await res.json();
      successCallback(visitas.map(v => ({
        title: `${v.clienteNome} (${v.horaVisita})`,
        start: `${v.dataVisita}T${v.horaVisita}`,
        extendedProps: v
      })));
    },
    eventClick: function(info) {
      const v = info.event.extendedProps;
      abrirModalDetalhes(v);
    }
  });
  calendario.render();
  window.calendario = calendario;
}

// --- Funções para o Modal de Detalhes da Visita ---
function abrirModalDetalhes(visita) {
  const detalhesEvento = document.getElementById("detalhes-evento");
  detalhesEvento.innerHTML = `
    <h2 class="modal-title">Detalhes da Visita</h2>
    <p><strong>Cliente:</strong> ${visita.clienteNome}</p>
    <p><strong>Email:</strong> ${visita.clienteEmail}</p>
    <p><strong>WhatsApp:</strong> ${visita.clienteWhatsapp}</p>
    <p><strong>Corretor:</strong> ${visita.corretorNome}</p>
    <p><strong>Email Corretor:</strong> ${visita.corretorEmail}</p>
    <p><strong>WhatsApp Corretor:</strong> ${visita.corretorWhatsapp}</p>
    <p><strong>Endereço:</strong> ${visita.endereco}</p>
    <p><strong>Observação:</strong> ${visita.observacao || 'Nenhuma'}</p>
    <p><strong>Status:</strong> ${visita.status}</p>
    <p><strong>Data e Hora:</strong> ${visita.dataVisita} às ${visita.horaVisita}</p>
  `;
  document.getElementById("modal-detalhes").classList.remove("hidden");
}

function fecharModalDetalhes() {
  document.getElementById("modal-detalhes").classList.add("hidden");
}

// --- Lógica do Painel Administrativo ---
function carregarVisitas() {
  const data = document.getElementById("filtroData").value;
  const corretor = document.getElementById("filtroCorretor").value;
  const status = document.getElementById("filtroStatus").value;

  const query = new URLSearchParams();
  if (data) query.append("data", data);
  if (corretor) query.append("corretor", corretor);
  if (status) query.append("status", status);

  fetch(`${API_URL}/visitas?${query.toString()}`)
    .then((response) => response.json())
    .then((visitas) => atualizarTabela(visitas))
    .catch((error) => console.error("Erro ao carregar visitas:", error));
}

function atualizarTabela(visitas) {
  const tbody = document.querySelector("#tabela-visitas tbody");
  tbody.innerHTML = "";

  visitas.forEach((visita) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${visita.dataVisita}</td>
      <td>${visita.horaVisita}</td>
      <td>${visita.clienteNome}</td>
      <td>${visita.corretorNome}</td>
      <td>${visita.status}</td>
      <td>
        <button class="editar" onclick="abrirModal('${visita._id}')">Editar</button>
        <button class="cancelar" onclick="cancelarVisita('${visita._id}')">Cancelar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function abrirModal(id) {
  fetch(`${API_URL}/visitas/${id}`)
    .then((res) => res.json())
    .then((visita) => {
      document.getElementById("editarId").value = visita._id;
      document.getElementById("editarClienteNome").value = visita.clienteNome;
      document.getElementById("editarClienteEmail").value = visita.clienteEmail;
      document.getElementById("editarClienteWhatsapp").value = visita.clienteWhatsapp;
      document.getElementById("editarCorretorNome").value = visita.corretorNome;
      document.getElementById("editarCorretorEmail").value = visita.corretorEmail;
      document.getElementById("editarCorretorWhatsapp").value = visita.corretorWhatsapp;
      document.getElementById("editarEndereco").value = visita.endereco;
      document.getElementById("editarData").value = visita.dataVisita;
      document.getElementById("editarHora").value = visita.horaVisita;
      document.getElementById("editarObservacao").value = visita.observacao;
      document.getElementById("editarStatus").value = visita.status;
      document.getElementById("modal-editar").classList.remove("hidden");
    });
}

function fecharModal() {
  document.getElementById("modal-editar").classList.add("hidden");
}

document.getElementById("form-editar").addEventListener("submit", async function (e) {
  e.preventDefault();

  const id = document.getElementById("editarId").value;
  const dados = Object.fromEntries(new FormData(e.target).entries());

  try {
    await fetch(`${API_URL}/visitas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    fecharModal();
    carregarVisitas();
    window.calendario.refetchEvents();
  } catch (error) {
    console.error("Erro ao atualizar visita:", error);
  }
});

async function cancelarVisita(id) {
  const confirmacao = confirm("Tem certeza que deseja cancelar esta visita?");
  if (!confirmacao) return;

  try {
    await fetch(`${API_URL}/visitas/${id}`, {
      method: "DELETE",
    });
    carregarVisitas();
    window.calendario.refetchEvents();
  } catch (error) {
    console.error("Erro ao cancelar visita:", error);
  }
}