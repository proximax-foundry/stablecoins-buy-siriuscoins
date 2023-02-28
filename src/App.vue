<template>
  <Loading v-model:active="isLoading" :can-cancel="false"
        :is-full-page="true" />
  <div class="flex flex-col justify-between md:min-h-screen bg-navy-primary" @click="clickEvent" ref="mainFrame">
    <Toast position="top-left" group="tl" />
    <Toast position="top-right" group="tr" />
    <Toast position="center" group="center" />
    <Toast position="bottom-left" group="bl" />
    <Toast position="bottom-right" group="br" style="word-break: break-all;" />
    <Toast position="top-right" group="tr-wait">
      <template #message="slotProps">
        <div style="width: 100%" class="grid grid-cols-12">
          <div class="col-span-2">
            <i class="pi pi-spin pi-spinner" style="font-size: 2.5rem"></i>
          </div>
          <div class="col-span-10">
            <div class="font-semibold">{{slotProps.message.summary}}</div>
          </div>
          <div class="col-span-12">
            <div class="text-sm">{{slotProps.message.detail}}</div>
            <div class="mt-1 text-xs">{{slotProps.message.detail2}}</div>
            <div :style="`font-size: ${slotProps.message.detail3RemSize ? slotProps.message.detail3RemSize : 1}rem`" v-if="slotProps.message.url">
              <a :href="slotProps.message.url" target="_blank">
              {{slotProps.message.detail3}}
              </a>
            </div>
            <div :style="`font-size: ${slotProps.message.detail3RemSize ? slotProps.message.detail3RemSize : 1}rem`" v-else>{{slotProps.message.detail3}}</div>
          </div> 
        </div>
      </template>
    </Toast>
    <Toast position="top-right" group="tr-custom">
      <template #message="slotProps">
        <div style="width: 100%" class="grid grid-cols-12">
          <div class="col-span-2">
            <i v-if="slotProps.message.severity === 'success'" class="pi pi-check-circle" style="font-size: 2.5rem"></i>
            <i v-else-if="slotProps.message.severity === 'error'" class="pi pi-times-circle" style="font-size: 2.5rem"></i>
            <i v-else-if="slotProps.message.severity === 'info'" class="pi pi-info-circle" style="font-size: 2.5rem"></i>
            <i v-else-if="slotProps.message.severity === 'warn'" class="pi pi-exclamation-circle" style="font-size: 2.5rem"></i>
          </div>
          <div class="col-span-10">
            <div class="font-semibold">{{slotProps.message.summary}}</div>
          </div>
          <div class="col-span-12">
            <div class="text-sm">{{slotProps.message.detail}}</div>
            <div class="mt-1 text-xs">{{slotProps.message.detail2}}</div>
            <div :style="`font-size: ${slotProps.message.detail3RemSize ? slotProps.message.detail3RemSize : 1}rem`" v-if="slotProps.message.url">
              <a :href="slotProps.message.url" target="_blank">
              {{slotProps.message.detail3}}
              </a>
            </div>
            <div :style="`font-size: ${slotProps.message.detail3RemSize ? slotProps.message.detail3RemSize : 1}rem`" v-else>{{slotProps.message.detail3}}</div>
          </div> 
        </div>
      </template>
    </Toast>
    <Toast position="bottom-right" group="br-custom">
      <template #message="slotProps">
        <div style="width: 100%" class="grid grid-cols-12">
          <div class="col-span-2">
            <i v-if="slotProps.message.severity === 'success'" class="pi pi-check-circle" style="font-size: 2.5rem"></i>
            <i v-else-if="slotProps.message.severity === 'error'" class="pi pi-times-circle" style="font-size: 2.5rem"></i>
            <i v-else-if="slotProps.message.severity === 'info'" class="pi pi-info-circle" style="font-size: 2.5rem"></i>
            <i v-else-if="slotProps.message.severity === 'warn'" class="pi pi-exclamation-circle" style="font-size: 2.5rem"></i>
          </div>
          <div class="col-span-10">
            <div class="font-semibold">{{slotProps.message.summary}}</div>
          </div>
          <div class="col-span-12">
            <div class="text-sm">{{slotProps.message.detail}}</div>
            <div class="mt-1 text-xs">{{slotProps.message.detail2}}</div>
            <div :style="`font-size: ${slotProps.message.detail3RemSize ? slotProps.message.detail3RemSize : 1}rem`" v-if="slotProps.message.url">
              <a :href="slotProps.message.url" target="_blank">
              {{slotProps.message.detail3}}
              </a>
            </div>
            <div :style="`font-size: ${slotProps.message.detail3RemSize ? slotProps.message.detail3RemSize : 1}rem`" v-else>{{slotProps.message.detail3}}</div>
            <div :style="`font-size: ${slotProps.message.detail4 && slotProps.message.detail4.length > 64 ? 0.4 : 0.5}rem`" >{{slotProps.message.detail4}}</div>
          </div> 
        </div>
      </template>
    </Toast>
    <headerComponent></headerComponent>
    <div class="flex min-full-screen">
      <div class="inline-block flex-grow overflow-hidden">
        <div class="flex flex-col min-full-screen">
          <router-view class="mt-10 lg:mt-16 flex-grow px-5 pt-5" :key="$route.path"></router-view>
          <footer class="md:h-9 mt-10 text-center sm:text-justify sm:flex text-txs md:text-xs sm:justify-between text-white px-10 flex-grow-0">
            <div class="ml-2 sm:ml-0">{{$t('home.copyright')}} <a href="https://t.me/proximaxhelpdesk" target=_new class="text-white hover:underline">{{$t('home.helpdesk')}}</a> </div>
            <div class="mr-2 sm:mr-0 py-2 sm:py-0"><span> {{$t('home.version')}} {{ versioning }}</span></div>
          </footer>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, getCurrentInstance, provide, watch, ref, reactive, onUnmounted, onMounted } from "vue";
import packageData from "../package.json";
import headerComponent from '@/components/headerComponent.vue'
import Toast from 'primevue/toast';
import { networkState } from './state/networkState';
import { ChainUtils } from "@/util/chainUtils";
import { useRouter } from 'vue-router';
import { AppState } from '@/state/appState'
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/vue-loading.css';

export default defineComponent({
  name: 'App',
  components: {
    headerComponent,
    Toast,
    Loading
  },

  setup() {
    const internalInstance = getCurrentInstance();
    const emitter = internalInstance!.appContext.config.globalProperties.emitter;

    const overflowScreen = ref(false);
    const mainFrame = ref(null);
    let contentHeight = ref(0);

    const isOverflow = () => {
      if(window.innerWidth > 768){
        if(window.innerHeight < contentHeight.value){
          overflowScreen.value = true;
        }else{
          overflowScreen.value = false;
        }
      }else{
        if(window.innerHeight < (contentHeight.value + 90)){
          overflowScreen.value = true;
        }else{
          overflowScreen.value = false;
        }
      }
    }

    const screenResizeHandler = () => {
      isOverflow();
    };
    screenResizeHandler();

    onUnmounted(() => {
      window.removeEventListener("resize", screenResizeHandler);
    });

    onMounted(() => {
      contentHeight.value = mainFrame.value.clientHeight;
      isOverflow();
      window.addEventListener("resize", screenResizeHandler);
    });

    const isLoading = computed(()=>{ return !AppState.isReady});

    const router = useRouter();
    // chainNetwork.updateAvailableNetworks();
    const currentRouteName = computed(() => {
      return router.currentRoute.value.name;
    });

    const versioning = ref('0.0.1');

    versioning.value = packageData.version;

    // emitter for drop down menu in viewAllAccounts and Services page
    const clickEvent = () => {
      emitter.emit("PAGE_CLICK");
    };

    return{
      clickEvent,
      versioning,
      currentRouteName,
      isLoading,
      overflowScreen,
      mainFrame
    }
  }
});
</script>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.full-screen{
  height:calc(100vh - 4rem) !important;
}

.min-full-screen{
  min-height:calc(100vh) !important;
}


</style>