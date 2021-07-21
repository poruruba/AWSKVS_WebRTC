'use strict';

//const vConsole = new VConsole();
//window.datgui = new dat.GUI();

var vue_options = {
    el: "#top",
    mixins: [mixins_bootstrap],
    data: {
        list_name: ["pmx_list", "stage_list", "vmd_list" ],
        list_item: [],
        list_index: [-1, -1, -1],
        current_item: [{}, {}, {}]
    },
    computed: {
    },
    methods: {
        item_select: function(type){
            var index = this.list_index[type];
            this.current_item[type].title = this.list_item[type].list[index].title;
            this.current_item[type].fname = this.list_item[type].list[index].fname;
        },
        item_add: function(type){
            this.list_item[type].list.push({ title: this.current_item[type].title, fname: this.current_item[type].fname});
            this.list_item = JSON.parse(JSON.stringify(this.list_item));

            Cookies.set(this.list_name[type], this.list_item[type], { expires: 365 });
        },
        item_delete: function(type){
            var index = this.list_index[type];
            if( index < 0 )
                return;
            if (!confirm('本当に削除しますか？'))
                return;
            this.list_item[type].list.splice(index, 1);
            this.list_index[type] = -1;
            this.list_item = JSON.parse(JSON.stringify(this.list_item));
            Cookies.set(this.list_name[type], this.list_item[type], { expires: 365 });
            this.current_item[type].title = "";
            this.current_item[type].fname = "";
        }
    },
    created: function(){
        for (var i = 0; i < this.list_name.length; i++) {
            var list = Cookies.get(this.list_name[i]);
            if (list)
                this.list_item[i] = JSON.parse(list);
            else
                this.list_item[i] = { list: [] };
            console.log(list);
        }
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
