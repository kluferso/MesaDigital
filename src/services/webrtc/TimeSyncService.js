class TimeSyncService {
  constructor(socket) {
    this.socket = socket;
    this.serverOffset = 0; // ServerTime - LocalTime
    this.syncPromise = null;
  }

  async synchronize() {
    if (this.syncPromise) return this.syncPromise;

    this.syncPromise = new Promise(async (resolve) => {
      const pings = [];
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await new Promise(r => {
          this.socket.emit('time_sync', { t0: start }, (serverTime) => {
            const end = Date.now();
            const latency = (end - start) / 2;
            const offset = serverTime - (end - latency);
            pings.push(offset);
            r();
          });
        });
        // Pequeno delay entre pings
        await new Promise(r => setTimeout(r, 100));
      }

      // Ordenar e descartar outliers (simples)
      pings.sort((a, b) => a - b);
      // Pegar a mediana
      this.serverOffset = pings[Math.floor(pings.length / 2)];
      
      console.log('TimeSync sincronizado. Offset:', this.serverOffset, 'ms');
      resolve(this.serverOffset);
      this.syncPromise = null;
    });

    return this.syncPromise;
  }

  getServerTime() {
    return Date.now() + this.serverOffset;
  }

  // Converte tempo do servidor para tempo local
  toLocalTime(serverTime) {
    return serverTime - this.serverOffset;
  }
}

export default TimeSyncService;
