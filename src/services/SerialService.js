class SerialService {
  constructor() {
    this.port = null;
    this.reader = null;
    this.writer = null;
  }

  async connect() {
    try {
      // Request port access
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 9600 });
      console.log("Serial connection established");
      return true;
    } catch (error) {
      console.error("Error connecting to serial port:", error);
      return false;
    }
  }

  async write(data) {
    if (!this.port?.writable) {
      throw new Error("Serial port is not writable");
    }

    const writer = this.port.writable.getWriter();
    try {
      await writer.write(new TextEncoder().encode(data));
    } finally {
      writer.releaseLock();
    }
  }

  async disconnect() {
    if (this.reader) {
      await this.reader.cancel();
      this.reader = null;
    }
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
  }

  isConnected() {
    return this.port !== null;
  }
}

export default new SerialService();
