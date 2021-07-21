'use strict';

//const vConsole = new VConsole();
//window.datgui = new dat.GUI();

const AWS_ACCESSKEY_ID = '【AWSアクセスキーID(ビューア用)】';
const AWS_SECRET_ACCESSKEY = '【AWSシークレットアクセスキー(ビューア用)】';
const SIGNALING_CHANNEL_NAME = '【AWSシグナリングチャネル名】';
const SIGNALING_CLIENT_ID = "";
const VIEW_WIDHT = 640;
const VIEW_HEIGHT = 480;

var vue_options = {
    el: "#top",
    mixins: [mixins_bootstrap],
    data: {
        aws_accesskey_id: AWS_ACCESSKEY_ID,
        aws_secret_accesskey: AWS_SECRET_ACCESSKEY,
        signaling_channel_name: SIGNALING_CHANNEL_NAME,
        signaling_client_id: SIGNALING_CLIENT_ID,

        width: VIEW_WIDHT,
        height: VIEW_HEIGHT,

        webrtc_opened: false,
        message_logs: '',
        message_data: '',
        signalingClient: null,
    },
    computed: {
    },
    methods: {
        startViewer: async function() {
            try {
                var params = {
                    accessKeyId: this.aws_accesskey_id,
                    secretAccessKey: this.aws_secret_accesskey,
                    channelName: this.signaling_channel_name,
                    clientId: this.signaling_client_id || getRandomClientId(),
                    openDataChannel: true,
                    useTrickleICE: true,
                };
                this.signalingClient = await startViewer(document.querySelector('#remote-view'), params, (type, event) => {
                    console.log(type, event);
                    if (type == 'sdpAnswer' ){
                        this.webrtc_opened = true;
                        this.panel_close('#webrtc_config_panel');
                    }else if( type == 'close'){
                        this.webrtc_opened = false;
                        this.panel_open('#webrtc_config_panel');
                    }else if( type == 'message'){
                        var now = new Date().toLocaleString('ja-JP', {});
                        this.message_logs = '[' + now + ' - master] ' + event.event.data + '\n' + this.message_logs;
                    }
                });
            } catch (error) {
                console.error(error);
                alert(error);
            }
        },
        stopViewer: function(){
            stopViewer(this.signalingClient);
        },
        send_message: function(){
            try{
                sendViewerMessage(this.message_data);
                this.message_logs = '[' + new Date().toLocaleString('ja-JP', {}) + ' - local] ' +this.message_data + '\n' + this.message_logs;
            }catch(error){
                console.error(error);
                alert(error);
            }
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

function getRandomClientId() {
    console.log("call: getRandomClientId");

    return Math.random()
        .toString(36)
        .substring(2)
        .toUpperCase();
}
