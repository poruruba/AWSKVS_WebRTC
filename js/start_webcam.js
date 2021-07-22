'use strict';

//const vConsole = new VConsole();
//window.datgui = new dat.GUI();

const AWS_ACCESSKEY_ID = '【AWSアクセスキーID(マスター用)】';
const AWS_SECRET_ACCESSKEY = '【AWSシークレットアクセスキー(マスター用)】';
const SIGNALING_CHANNEL_NAME = '【AWSシグナリングチャネル名】';
const VIEW_WIDHT = 640;
const VIEW_HEIGHT = 480;

var vue_options = {
    el: "#top",
    mixins: [mixins_bootstrap],
    data: {
        aws_accesskey_id: AWS_ACCESSKEY_ID,
        aws_secret_accesskey: AWS_SECRET_ACCESSKEY,
        signaling_channel_name: SIGNALING_CHANNEL_NAME,

        width: VIEW_WIDHT,
        height: VIEW_HEIGHT,
        webrtc_opened: false,
        message_logs: '',
        message_data: '',
        signalingClient: null,
        stream: null,
        facingmode: "user",
    },
    computed: {
    },
    methods: {
        webcam_stop: function(){
            stopMaster(this.signalingClient);
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                var video = $('#video_0')[0];
                video.srcObject = null;
                this.stream = null;
            }
        },
        webcam_start: async function(){
            navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                    console.log(devices);
                });

            const constraints = {
                video: { facingMode: this.facingmode, width: { ideal: this.width }, height: { ideal: this.height } },
                audio: true,
            };
            var video = $('#video_0')[0];
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = this.stream;

            this.startMaster(this.stream);
        },
        startMaster: async function (stream) {
            try {
                var params = {
                    accessKeyId: this.aws_accesskey_id,
                    secretAccessKey: this.aws_secret_accesskey,
                    channelName: this.signaling_channel_name,
                    openDataChannel: true,
                    useTrickleICE: true,
                };
                this.signalingClient = await startMaster(stream, params, (type, event) => {
                    console.log(type, event);
                    if (type == 'open') {
                        this.webrtc_opened = true;
                        this.panel_close('#webrtc_config_panel');
                    } else if (type == 'close') {
                        this.webrtc_opened = false;
                        this.panel_open('#webrtc_config_panel');
                    } else if (type == 'message') {
                        var now = new Date().toLocaleString('ja-JP', {});
                        this.message_logs = '[' + now + ' - ' + event.target + '] ' + event.event.data + '\n' + this.message_logs;
                    }
                });
            } catch (error) {
                console.error(error);
                alert(error);
            }
        },
        send_message: function(){
            sendMasterMessage(this.message_data);
            this.message_logs = '[' + new Date().toLocaleString('ja-JP', {}) + ' - master] ' +this.message_data + '\n' + this.message_logs;
        }
    },
    created: function(){
    },
    mounted: function(){
        proc_load();
    }
};
vue_add_data(vue_options, { progress_title: '' }); // for progress-dialog
vue_add_global_components(components_bootstrap);
vue_add_global_components(components_utils);

/* add additional components */
  
window.vue = new Vue( vue_options );
