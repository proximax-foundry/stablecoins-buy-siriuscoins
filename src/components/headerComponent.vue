<template>
  <header class="z-10 fixed w-full">
    <div class="header-height flex items-stretch lg:pr-2 filter drop-shadow-xl bg-navy-primary">
      <div class=" flex justify-center items-center lg:bg-navy-primary logo-header">
        <router-link :to="{ name: 'ViewServicesStableCoinsBuy' }">
          <img src="@/assets/img/sirius-logo-whitetext.svg" class="w-24 -ml-4 tsm:w-40 hidden lg:inline-block">
        </router-link>
      </div>
      <div class=" flex items-center ml-auto mr-28 lg:mr-auto lg:ml-10 logo-header">
        <router-link :to="{ name: 'ViewServicesStableCoinsBuy' }">
          <img src="@/assets/img/sirius-logo-whitetext.svg" class="w-40 lg:hidden">
        </router-link>
      </div>

      <div class="flex flex-row ml-auto h-full">
        <div class="hidden w-40 pl-3 text-center lg:flex items-center">
          <div class="lg:flex lg:items-center">
            <img src="@/assets/img/icon-testnet-block.svg" class="w-3 lg:w-7 block lg:inline-block"
              :title="chainAPIEndpoint" v-if="wideScreen && !isMainnet">
            <img src="@/assets/img/icon-mainnet-block.svg" class="w-3 lg:w-7 block lg:inline-block"
              :title="chainAPIEndpoint" v-if="wideScreen && isMainnet">  
            <div class="block lg:inline-block text-txs text-white text-left lg:ml-2">
              <div class="text-xxs lg:text-tsm text-white">
                {{ networkState.chainNetworkName }}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </header>
</template>

<script>
import { computed, defineComponent, getCurrentInstance, inject, ref, watch } from "vue";
import { networkState } from "@/state/networkState";
import { AppState } from "@/state/appState";
import { useRouter } from "vue-router";
import { NetworkStateUtils } from '@/state/utils/networkStateUtils';
import { ChainUtils } from '@/util/chainUtils';
import { Helper } from '@/util/typeHelper';

import { useToast } from "primevue/usetoast";
import { useI18n } from 'vue-i18n'
import { UnitConverter } from '@/util/unitConverter';
import { TimeUnit } from '@/models/const/timeUnit';
import { AppStateUtils } from "@/state/utils/appStateUtils";
import { NetworkType } from "tsjs-xpx-chain-sdk";

export default defineComponent({
  components: {},

  name: 'headerComponent',
  data() {
    return {
      login: false,
      wideScreen: false,
    };
  },
  setup() {
    const { t } = useI18n();
    const toast = useToast();
    const internalInstance = getCurrentInstance();
    const emitter = internalInstance.appContext.config.globalProperties.emitter;
    const router = useRouter();

    const isHoverCreate = ref(false);
    const isShowCreate = ref(false);
    const isHoverCreatePanel = ref(false);

    const setHoverCreateToTrue = () => {
      isHoverCreate.value = true;
      isShowCreate.value = true;
    }
    const setHoverCreateToFalse = () => {
      isHoverCreate.value = false;
      setTimeout(() => {
        if (!isHoverCreatePanel.value && !isHoverCreate.value) {
          isShowCreate.value = false;
        }
      }, 100);
    }
    const hideCreatePanel = () => {
      isHoverCreatePanel.value = false;
      setTimeout(() => {
        if (!isHoverCreate.value && !isHoverCreatePanel.value) {
          isShowCreate.value = false;
        }
      }, 100);
    }

    const isHoverSupport = ref(false);
    const isShowSupport = ref(false);
    const isHoverSupportPanel = ref(false);
    const setHoverSupportToTrue = () => {
      isHoverSupport.value = true;
      isShowSupport.value = true;
    }
    const setHoverSupportToFalse = () => {
      isHoverSupport.value = false;
      setTimeout(() => {
        if (!isHoverSupportPanel.value && !isHoverSupport.value) {
          isShowSupport.value = false;
        }
      }, 100);
    }
    const hideSupportPanel = () => {
      isHoverSupportPanel.value = false;
      setTimeout(() => {
        if (!isHoverSupport.value && !isHoverSupportPanel.value) {
          isShowSupport.value = false;
        }
      }, 100);
    }

    const chainAPIEndpoint = computed(() => AppState.nodeFullURL)
    const isMainnet = computed(()=> AppState.networkType === NetworkType.MAIN_NET)
    const chainsNetworks = computed(() => {

      let options = [];
      networkState.availableNetworks.forEach((network, index) => {
        options.push({ label: network, value: index });
      });
      return options;
    });

    const currentNativeTokenName = computed(() => AppState.nativeToken.label);
    const currentNativeTokenDivisibility = computed(() => AppState.nativeToken.divisibility);

    const chainsNetworkOption = computed(() => {

      return [{
        label: t('Header.network'),
        items: chainsNetworks.value
      }];
    });

    const selectedNetwork = computed(() => { return { label: networkState.chainNetworkName, value: networkState.chainNetwork } });

    const selectNetwork = (e) => {
      NetworkStateUtils.changeNetworkByIndex(parseInt(e.value.value));
    }

    const currentNetworkType = computed(() => networkState.currentNetworkProfile ? AppState.networkType : null);

    const createTxnHashExplorerLink = (txnHash) => {
      return `${networkState.currentNetworkProfile.chainExplorer.url}/${networkState.currentNetworkProfile.chainExplorer.hashRoute}/${txnHash}`;
    }

    return {
      isMainnet,
      networkState,
      chainsNetworks,
      selectedNetwork,
      selectNetwork,
      chainAPIEndpoint,
      chainsNetworkOption,
      currentNativeTokenName,
      // listener,
      isHoverCreate,
      isShowCreate,
      setHoverCreateToTrue,
      setHoverCreateToFalse,
      hideCreatePanel,
      isHoverCreatePanel,
      isHoverSupport,
      isShowSupport,
      setHoverSupportToTrue,
      setHoverSupportToFalse,
      hideSupportPanel,
      isHoverSupportPanel
    };
  },
  created() {
    this.headerMenuHandler();
    window.addEventListener("resize", this.headerMenuHandler);
  },
  beforeUnmount() {
    // this.listener.terminate();
  },
  unmounted() {
    window.removeEventListener("resize", this.headerMenuHandler);
  },
  methods: {
    headerMenuHandler: function () {
      if (window.innerWidth < 768) {
        this.wideScreen = false;
      } else {
        this.wideScreen = true;
      }
    },
  }
});
</script>

<style lang="scss">
@import "../assets/scss/multiselect.scss";

.left-gray-line {
  border-left: 1px solid #dedede;
}

.right-gray-line {
  border-right: 1px solid #dedede;
}

.gray-bar {
  background: #3F4058;
}

.lang-mobile-placement {
  top: -30px;
  position: relative;
}

.lang-mobile-placement-postlogin {
  position: relative;
  top: 0px !important;
  left: -35px;
}

.logo-header {
  width: 115px;
}

.header-height {
  @apply h-12;
}

.header-menu {
  margin-left: 5px;
}

.header-menu a {
  font-size: 15px;
  margin-left: 10px;
}

.version-text {
  @apply text-gray-400;
  font-size: 10px;
  position: relative;
  top: 4px;
  left: 5px;
}

@screen lg {
  .logo-header {
    width: 240px;
  }

  .version-text {
    font-size: 13px;
    top: 5px;
    left: 5px;
  }

  .lang-mobile-placement-postlogin {
    left: 0px;
  }
}

.p-hidden-accessible {
  border: 0;
  clip: rect(0 0 0 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
}

.p-hidden-accessible input,
.p-hidden-accessible select {
  transform: scale(0);
}

.p-inputtext {
  margin: 0;
}

.p-inputtext {
  width: 100%;
}

.p-inputtext {
  // font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  font-size: 12px;
  color: #495057;
  background: #ffffff;
  padding: 3px 5px;
  padding-right: 0px;
  border: 1px solid #ced4da;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
  appearance: none;
  border-radius: 3px;
}

.p-inputtext:enabled:hover {
  border-color: #2196F3;
}

.p-inputtext:enabled:focus {
  outline: 0 none;
  outline-offset: 0;
  box-shadow: 0 0 0 0.2rem #a6d5fa;
  border-color: #2196F3;
}

.p-inputtext.p-invalid.p-component {
  border-color: #f44336;
}

.p-inputtext.p-inputtext-sm {
  font-size: 0.875rem;
  padding: 0.4375rem 0.4375rem;
}

.p-inputtext.p-inputtext-lg {
  font-size: 1.25rem;
  padding: 0.625rem 0.625rem;
}

.p-component {
  // font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  font-size: 1rem;
  font-weight: normal;
}

.p-dropdown {
  background: #ffffff;
  border-bottom: 1px solid #ced4da;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
  border-radius: 3px;
  width: 110px;
  margin-top: 10px;
}

.p-dropdown.p-dropdown-clearable .p-dropdown-label {
  padding-right: 1.5rem;
}

.p-dropdown .p-dropdown-label {
  background: transparent;
  border: 0 none;
}

.p-dropdown .p-dropdown-label.p-placeholder {
  color: #6c757d;
}

.p-dropdown .p-dropdown-label:enabled:focus {
  outline: 0 none;
  box-shadow: none;
}

.p-dropdown .p-dropdown-trigger {
  background: transparent;
  color: #6c757d;
  width: 20px;
  border-top-right-radius: 3px;
  border-bottom-right-radius: 3px;
}

.p-dropdown.p-invalid.p-component {
  border-color: #f44336;
}

.p-dropdown-panel {
  background: #ffffff;
  color: #495057;
  border: 0 none;
  border-radius: 3px;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);
}

.p-dropdown-panel .p-dropdown-header {
  padding: 0.5rem 1rem;
  border-bottom: 0 none;
  color: #495057;
  background: #f8f9fa;
  margin: 0;
  border-top-right-radius: 3px;
  border-top-left-radius: 3px;
}

.p-dropdown-panel .p-dropdown-header .p-dropdown-filter {
  padding-right: 1.5rem;
}

.p-dropdown-panel .p-dropdown-header .p-dropdown-filter-icon {
  right: 0.5rem;
  color: #6c757d;
}

.p-dropdown-panel .p-dropdown-items {
  padding: 0.5rem 0;
}

.p-dropdown-panel .p-dropdown-items .p-dropdown-item {
  margin: 0;
  padding: 5px 10px;
  border: 0 none;
  color: #495057;
  background: transparent;
  transition: box-shadow 0.2s;
  border-radius: 0;
}

.p-dropdown-panel .p-dropdown-items .p-dropdown-item.p-highlight {
  color: #495057;
  background: #e9ecef;
  display: block;
}

.p-dropdown-panel .p-dropdown-items .p-dropdown-item:not(.p-disabled):hover {
  color: #495057;
  background: #E3F2FD;
}

.p-dropdown-panel .p-dropdown-items .p-dropdown-item-group {
  margin: 0;
  padding: 0px 10px;
  color: #495057;
  background: #ffffff;
  font-weight: 700;
  font-size: 12px;
}

.p-dropdown-panel .p-dropdown-items .p-dropdown-empty-message {
  padding: 0.5rem 1rem;
  color: #495057;
  background: transparent;
}

.p-input-filled .p-dropdown {
  background: #f8f9fa;
}

.p-input-filled .p-dropdown:not(.p-disabled):hover {
  background-color: #f8f9fa;
}

.p-input-filled .p-dropdown:not(.p-disabled).p-focus {
  background-color: #ffffff;
}

.notification_counter {
  right: 8px;
  top: -2px;
}

@screen lg {
  .header-height {
    @apply h-16;
  }

  .header-menu {
    margin-left: 20px;
  }

  .p-inputtext {
    font-size: 16px;
    padding-right: 5px;
  }

  .p-dropdown {
    width: 150px;
    margin-top: 0px;
  }

  .p-dropdown .p-dropdown-trigger {
    width: 30px;
  }

  .notification_counter {
    right: 15px;
    top: -2px;
  }
}</style>