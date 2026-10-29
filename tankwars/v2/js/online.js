(() => {
  const online = window.TankWarsOnline = {
    mode: 'menu', user: null, room: null, socket: null, pendingState: null,
    isOnline() { return this.mode === 'online'; },
    send(command) { if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({type:'command',command})); },
    quitToMenu: null,
    showLaunchScreen: null
  };
  const $ = id => document.getElementById(id);
  const screen=$('launch-screen'), error=$('launch-error'), modeSelection=$('mode-selection'), options=$('online-options'), roomPanel=$('room-panel');
  let searchPollTimer = null;

  async function request(url,method='GET',body) {
    const response=await fetch(url,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.error||'Request failed.');
    return data;
  }

  function showError(message) { error.textContent=message||''; }
  function selectedLevel() { return Number($('online-level').value)||1; }

  function startSearchPolling() {
    stopSearchPolling();
    searchPollTimer = setInterval(async () => {
      try {
        const status = await request('/api/lobby/status');
        if (status?.room) {
          stopSearchPolling();
          showRoom(status.room, false);
        } else if (!status?.queued && !online.room) {
          stopSearchPolling();
        }
      } catch {
        /* ignore polling errors */
      }
    }, 1500);
  }

  function stopSearchPolling() {
    if (searchPollTimer) {
      clearInterval(searchPollTimer);
      searchPollTimer = null;
    }
  }

  function formatStats(user) {
    if (!user) return '';
    const wins = user.wins || 0;
    const losses = user.losses || 0;
    const total = user.totalMatches || (wins + losses);
    const rate = user.winRate ?? (total > 0 ? Math.round((wins / total) * 100) : 0);
    return `<div class="user-stats-pill">🏆 <strong>${wins} WINS</strong> • ${losses} LOSSES • ${rate}% WIN RATE</div>`;
  }

  function updateUserDisplay(user) {
    online.user = user;
    const el = $('launch-user');
    if (!el) return;
    if (user) {
      el.innerHTML = `Signed in as <strong>${user.username}</strong>${formatStats(user)}`;
    } else {
      el.innerHTML = 'Online play requires a <a href="../../index.html">Games Vault login</a>.';
    }
  }

  async function refreshUserStats() {
    try {
      const { user } = await request('/api/auth/me');
      updateUserDisplay(user);
    } catch {}
  }

  function showRoom(room, searching=false) {
    online.room = room;
    modeSelection.hidden = true;
    options.hidden = true;
    roomPanel.hidden = false;
    showError('');

    const cancelBtn = $('cancel-room');
    const readyBtn = $('ready-game');

    if (searching) {
      startSearchPolling();
      $('room-code').textContent = 'SEARCH';
      $('room-status').textContent = 'Searching for another commander…';
      $('room-players').innerHTML = '<div style="justify-content:center; color:#94a3b8;">Scanning network for waiting players…</div>';
      if (readyBtn) readyBtn.style.display = 'none';
      if (cancelBtn) { cancelBtn.textContent = 'CANCEL SEARCH'; cancelBtn.style.display = ''; }
      return;
    }

    stopSearchPolling();
    if (readyBtn) readyBtn.style.display = '';
    if (cancelBtn) { cancelBtn.textContent = 'QUIT / LEAVE ROOM'; cancelBtn.style.display = ''; }

    $('room-code').textContent = room?.code || '------';
    $('room-status').textContent = room?.players?.length < 2
      ? 'Waiting for opponent to enter the code…'
      : 'Both commanders connected.';
    $('room-players').innerHTML = (room?.players || []).map(p =>
      `<div><span>${p.username} <small class="player-wins-badge">🏆 ${p.wins || 0}W</small></span><strong>${p.ready ? 'READY' : 'NOT READY'}</strong></div>`
    ).join('');

    const me = room?.players?.find(p => p.seat === 'you');
    if (readyBtn) {
      readyBtn.disabled = !room || room.players.length < 2 || me?.ready;
      readyBtn.textContent = me?.ready ? 'READY — WAITING' : 'READY TO START';
    }
  }

  async function quitOrCancel() {
    stopSearchPolling();
    try { await request('/api/rooms/leave', 'POST'); } catch {}
    try { await request('/api/matchmaking', 'DELETE'); } catch {}
    online.room = null;
    online.mode = 'menu';
    roomPanel.hidden = true;
    options.hidden = true;
    modeSelection.hidden = false;
    screen.hidden = false;
    showError('');
    const banner = $('network-banner');
    if (banner) banner.hidden = true;
    if (window.stopTankWarsGame) window.stopTankWarsGame();
    refreshUserStats();
  }

  online.quitToMenu = quitOrCancel;
  online.showLaunchScreen = () => {
    stopSearchPolling();
    screen.hidden = false;
    modeSelection.hidden = false;
    options.hidden = true;
    roomPanel.hidden = true;
    online.mode = 'menu';
    online.room = null;
    showError('');
    refreshUserStats();
  };

  function connectSocket() {
    if (online.socket && (online.socket.readyState === WebSocket.OPEN || online.socket.readyState === WebSocket.CONNECTING)) return;
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${location.host}/ws`);
    online.socket = ws;

    ws.onmessage = event => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'forfeit') {
          if (window.showForfeitVictory) {
            window.showForfeitVictory(message.title, message.text);
          }
          const banner = $('network-banner');
          if (banner) {
            banner.hidden = false;
            banner.textContent = message.text;
          }
          refreshUserStats();
        }
        if (message.type === 'lobby') {
          if (message.room) {
            stopSearchPolling();
            showRoom(message.room);
            if (message.room.status === 'active') online.mode = 'online';
          }
          if (message.forfeited) {
            const banner = $('network-banner');
            if (banner) { banner.hidden = false; banner.textContent = 'Opponent left the match.'; }
            refreshUserStats();
          }
        }
        if (message.type === 'state') {
          online.mode = 'online';
          screen.hidden = true;
          if (window.applyOnlineSnapshot) window.applyOnlineSnapshot(message.state);
          else online.pendingState = message.state;
        }
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    ws.onclose = () => {
      online.socket = null;
      if (online.mode === 'online') {
        const banner = $('network-banner');
        if (banner) { banner.hidden = false; banner.textContent = 'Connection lost — attempting to reconnect…'; }
      }
      if (online.user) {
        setTimeout(connectSocket, 2000);
      }
    };
  }

  $('play-solo').addEventListener('click', () => {
    online.mode = 'solo';
    screen.hidden = true;
    window.startTankWarsSolo?.();
  });

  $('play-online').addEventListener('click', () => {
    if (!online.user) {
      showError('Sign in from the Games Vault before starting an online match.');
      return;
    }
    modeSelection.hidden = true;
    options.hidden = false;
    showError('');
    connectSocket();
  });

  $('online-back').addEventListener('click', quitOrCancel);
  $('cancel-room')?.addEventListener('click', quitOrCancel);

  $('create-room').addEventListener('click', async () => {
    try {
      const res = await request('/api/rooms', 'POST', { level: selectedLevel() });
      showRoom(res.room);
    } catch (e) {
      showError(e.message);
    }
  });

  $('join-room').addEventListener('click', async () => {
    try {
      const code = $('game-code').value.trim().toUpperCase();
      if (code.length !== 6) throw new Error('Enter the six-character game code.');
      const res = await request(`/api/rooms/${code}/join`, 'POST');
      showRoom(res.room);
    } catch (e) {
      showError(e.message);
    }
  });

  $('find-opponent').addEventListener('click', async () => {
    try {
      const result = await request('/api/matchmaking/join', 'POST', { level: selectedLevel() });
      showRoom(result.room, result.matched === false);
    } catch (e) {
      showError(e.message);
    }
  });

  $('ready-game').addEventListener('click', async () => {
    try {
      if (!online.room?.code) return;
      const res = await request(`/api/rooms/${online.room.code}/ready`, 'POST');
      showRoom(res.room);
    } catch (e) {
      showError(e.message);
    }
  });

  $('game-code').addEventListener('input', event => {
    event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });

  document.querySelectorAll('.launch-home-btn, .launch-exit-btn-link').forEach(btn => {
    btn.addEventListener('click', async event => {
      event.preventDefault();
      try { await quitOrCancel(); } catch {}
      window.location.href = btn.getAttribute('href') || '../../index.html';
    });
  });

  request('/api/auth/me').then(({ user }) => {
    updateUserDisplay(user);
    if (user) {
      connectSocket();
      return request('/api/lobby/status');
    }
  }).then(status => {
    if (status?.room) showRoom(status.room);
    else if (status?.queued) showRoom(null, true);
  }).catch(e => showError(e.message));
})();
