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

        stage_list: [],
        character_list: [],
        animation_list: [],
        selecting: {
            index: -1,
            mmd: null,
            pause: false,
            vmd_index: -1,
        },
        selecting_stage: "",
        width: VIEW_WIDHT,
        height: VIEW_HEIGHT,
        mmd_fps: 30,
        webrtc_opened: false,
        message_logs: '',
        message_data: '',
        signalingClient: null,
    },
    computed: {
    },
    methods: {
        pause_resume: async function () {
            if (!this.selecting.mmd)
                return;

            if (!this.selecting.pause) {
                this.selecting.mmd.pause_animate();
                this.selecting.pause = true;
            } else {
                this.selecting.mmd.start_animate();
                this.selecting.pause = false;
            }
        },
        select_change: async function () {
            if (this.selecting.index < 0)
                return;

            if (this.selecting.mmd)
                this.selecting.mmd.dispose();

            this.selecting.mmd = new MmdView($('#canvas_0')[0], this.width, this.height);
            try {
                this.progress_open();
                await this.selecting.mmd.loadWithAnimations(
                    this.character_list[this.selecting.index].fname, this.animation_list.map(item => item.fname), this.selecting_stage ? this.selecting_stage : "");
                this.selecting.vmd_index = -1;
            } catch (error) {
                console.error(error);
                alert(error);
            } finally {
                this.progress_close();
            }
        },
        vmd_change: async function(){
            if (!this.selecting.mmd)
                return;
            if( this.selecting.vmd_index < 0 )
                return;
            this.selecting.mmd.change(this.selecting.vmd_index);
        },
        mmd_stop: function(){
            if (!this.selecting.mmd)
                return;
            this.selecting.mmd.dispose();
            this.selecting.mmd = null;
            this.selecting.index = -1;
            this.selecting.vmd_index = -1;
        },
        stream_start: async function(){
            var stream = document.querySelector('#canvas_0').captureStream(this.mmd_fps);
            this.startMaster(stream);
        },
        startMaster: async function(stream) {
            try{
                var params = {
                    accessKeyId: this.aws_accesskey_id,
                    secretAccessKey: this.aws_secret_accesskey,
                    channelName: this.signaling_channel_name,
                    openDataChannel: true,
                    useTrickleICE: true,
                };
                this.signalingClient = await startMaster(stream, params, (type, event) => {
                    console.log(type, event);
                    if( type == 'open' ){
                        this.webrtc_opened = true;
                        this.panel_close('#webrtc_config_panel');
                    }else if( type == 'close'){
                        this.webrtc_opened = false;
                        this.panel_open('#webrtc_config_panel');
                    }else if( type == 'message'){
                        var now = new Date().toLocaleString('ja-JP', {});
                        this.message_logs = '[' + now + ' - ' + event.target + '] ' + event.event.data + '\n' + this.message_logs;
                    }
                });
            } catch (error) {
                console.error(error);
                alert(error);
            }
        },
        stream_stop: function(){
            stopMaster(this.signalingClient);
        },
        send_message: function(){
            sendMasterMessage(this.message_data);
            this.message_logs = '[' + new Date().toLocaleString('ja-JP', {}) + ' - master] ' +this.message_data + '\n' + this.message_logs;
        }
    },
    created: function(){
        var list = Cookies.get("stage_list");
        if (list)
            this.stage_list = JSON.parse(list).list;
        var list = Cookies.get("pmx_list");
        if (list)
            this.character_list = JSON.parse(list).list;
        var list = Cookies.get("vmd_list");
        if (list)
            this.animation_list = JSON.parse(list).list;
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
