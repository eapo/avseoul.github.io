let AudioAnalyzer = function (gain) {
    this.isInit = false;
    this.isPulse = false;

    this.debugCanvas = null;
    this.debugCanvasCtx = null;

    this.FFT_SIZE = 512;

    this.bass = 0.;
    this.mid = 0.;
    this.high = 0.;
    this.level = 0.;

    this.cutout = .5;

    this.frame = 0;

    navigator.getUserMedia = (
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia
    );

    if (navigator.getUserMedia) {
        console.log('getUserMedia supported.');

        navigator.getUserMedia({
            audio: true

        }, this.init.bind(this, gain),
            this.init_without_stream.bind(this));
    }
    else {
        if (window.location.protocol == 'https:') {
            this.init_without_stream();
        }

        console.log('getUserMedia not supported on your browser!');
    }
};

AudioAnalyzer.prototype.init = function (gain, stream) {
    const audioCtx = new (
        window.AudioContext ||
        window.webkitAudioContext ||
        window.mozAudioContext ||
        window.msAudioContext)();
    const mediaStreamSource = audioCtx.createMediaStreamSource(stream);

    this.analyzer = audioCtx.createAnalyser();
    this.analyzer.fftSize = this.FFT_SIZE;

    this.gain = audioCtx.createGain();
    mediaStreamSource.connect(this.gain);
    this.gain.connect(this.analyzer);
    this.gain.gain.value = gain || 70.;

    this.reset_history();

    this.audioBuffer = new Uint8Array(this.analyzer.frequencyBinCount);

    this.isInit = true;
};

AudioAnalyzer.prototype.init_without_stream = function () {
    alert("microphone is not detected. pulse is activated instead of mic input");

    this.reset_history();

    console.log("audio analyzer is init without mic");

    this.isInit = true;
    this.isPulse = true;
};

AudioAnalyzer.prototype.update = function () {
    if (!this.isInit) return;

    let bass = 0, mid = 0, high = 0;
    if (!this.isPulse) {
        
        this.analyzer.getByteFrequencyData(this.audioBuffer);
        const passSize = this.analyzer.frequencyBinCount / 3;
        const DATA_SCALE = 255;

        for (let i = 0; i < this.analyzer.frequencyBinCount; i++) {
            
            const val = this.audioBuffer[i] / DATA_SCALE;

            if (val === Infinity || val < this.cutout) continue;

            if (i < passSize) bass += val;
            if (i >= passSize && i < passSize * 2) mid += val;
            if (i >= passSize * 2) high += val;
        }

        bass /= passSize;
        mid /= passSize;
        high /= passSize;

    } else {

        if (this.frame % 40 == (Math.floor(Math.random() * 40.))) {
            bass = Math.random();
            mid = Math.random();
            high = Math.random();
        }

        this.frame++;
    }
console.log(this.bass > 0 , this.mid > 0 , this.high > 0)
    this.bass = this.bass > bass ? this.bass * .96 : bass;
    this.mid = this.mid > mid ? this.mid * .96 : mid;
    this.high = this.high > high ? this.high * .96 : high;

    this.bass = Math.max(Math.min(this.bass, 1.), 0.);
    this.mid = Math.max(Math.min(this.mid, 1.), 0.);
    this.high = Math.max(Math.min(this.high, 1.), 0.);

    this.level = (this.bass + this.mid + this.high) / 3.;

    this.history += this.level * .01 + .005;
};

AudioAnalyzer.prototype.reset_history = function () {
    this.history = 0.;
};

AudioAnalyzer.prototype.set_gain = function (_val) {
    if (this.gain) this.gain.gain.value = _val;
};

AudioAnalyzer.prototype.get_gain = function () {
    if (this.gain) this.gain.gain.value;
};

AudioAnalyzer.prototype.get_bass = function () {
    return this.bass == undefined ? 0. : this.bass;
};

AudioAnalyzer.prototype.get_mid = function () {
    return this.mid == undefined ? 0. : this.mid;
};

AudioAnalyzer.prototype.get_high = function () {
    return this.high == undefined ? 0. : this.high;
};

AudioAnalyzer.prototype.get_level = function () {
    return this.level == undefined ? 0. : this.level;
};

AudioAnalyzer.prototype.get_history = function () {
    return this.history == undefined ? 0. : this.history;
};

AudioAnalyzer.prototype.trigger_pulse = function (_isPulse) {
    this.isPulse = _isPulse;
};

AudioAnalyzer.prototype.debug = function (_canvas = null) {
    let canvas = _canvas || this.debugCanvas;

    if (canvas === null) {
        this.debugCanvas = document.createElement("canvas");
        this.debugCanvas.className = "audioDebug";
        
        document.body.appendChild(this.debugCanvas);
        
        canvas = this.debugCanvas;
    }

    if(this.debugCanvasCtx === null)
        this.debugCanvasCtx = canvas.getContext("2d");

    this.debugCanvasCtx.fillStyle = 'rgb(255, 255, 255)';
    this.debugCanvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    const w = (canvas.width / 4.);
    let h;
    let x = 0;

    this.debugCanvasCtx.fillStyle = "rgb(0, 0, 0)";

    h = this.bass * canvas.height;
    this.debugCanvasCtx.fillRect(x, canvas.height - h, w, h);
    x += w;

    h = this.mid * canvas.height;
    this.debugCanvasCtx.fillRect(x, canvas.height - h, w, h);
    x += w;

    h = this.high * canvas.height;
    this.debugCanvasCtx.fillRect(x, canvas.height - h, w, h);
    x += w;

    h = this.level * canvas.height;
    this.debugCanvasCtx.fillRect(x, canvas.height - h, w, h);
    x += w;
};

