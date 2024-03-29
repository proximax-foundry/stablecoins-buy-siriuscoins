<template>
  <div>
    <div class='lg:w-9/12 ml-2 mr-2 lg:ml-auto lg:mr-auto mt-5 bg-white border border-white rounded-md shadow-lg'>
      <div class='mt-6 px-6 py-10 filter text-center'>
        <div class="text-md mb-3">Check Crosschain Swap Status</div>
        <transition name="slide">
          <div class="mt-10" :class="statusNotificationClassStyle" v-if="isSuccess">
            <div class="font-normal">
              <div class="md:flex my-3 md:my-1">
                <div class="md:w-56 text-left md:text-right mr-4">{{ remoteNetwork }} Transaction Hash:</div>
                <div class="font-semibold text-left"><a :href="remoteExplorerLink + remoteTxnHash" target=_blank class="hover:underline">{{ remoteTxnHash.substring(0, 7) + '...' + remoteTxnHash.slice(-7) }} <font-awesome-icon icon="external-link-alt" class="ml-1 w-3 h-3 self-center inline-block"></font-awesome-icon></a></div>
              </div>
              <div class="md:flex my-3 md:my-1" v-if="siriusTransactionHash">
                <div class="md:w-56 text-left md:text-right mr-4">Sirius Transaction Hash</div>
                <div class="font-semibold text-left"><a :href="explorerLink() + siriusTransactionHash" target=_blank class="hover:underline">{{ siriusTransactionHash.substring(0, 7) + '...' + siriusTransactionHash.slice(-7) }} <font-awesome-icon icon="external-link-alt" class="ml-1 w-3 h-3 self-center inline-block"></font-awesome-icon></a></div>
              </div>
              <div class="md:flex my-3 md:my-1">
                <div class="md:w-56 text-left md:text-right mr-4">{{ remoteNetwork }} Status</div>
                <div class="font-semibold text-left">{{ remoteTxnStatus }}</div>
              </div>
              <div class="md:flex my-3 md:my-1" if="siriusTxnStatus">
                <div class="md:w-56 text-left md:text-right mr-4">Sirius Status</div>
                <div class="font-semibold text-left">{{ siriusTxnStatus }}</div>
              </div>
              <div class="md:flex my-3 md:my-1">
                <div class="md:w-56 text-left md:text-right mr-4">Sirius Recipient Address</div>
                <div class="font-semibold text-left">{{ siriusAddress }}</div>
              </div>
              <div class="md:flex my-3 md:my-1">
                <div class="md:w-56 text-left md:text-right mr-4">Amount</div>
                <div class="font-semibold text-left">{{ amount }}</div>
              </div>
              <div class="md:flex my-3 md:my-1">
                <div class="md:w-56 text-left md:text-right mr-4">Time</div>
                <div class="font-semibold text-left">{{ time }}</div>
              </div>
            </div>
          </div>
        </transition>
        <transition name="slide">
          <div class="flex justify-center mt-10 error_box error error-text" v-if="customErrorMessage">
            {{ customErrorMessage }}
          </div>
        </transition>
        <div class="block text-left">
          <div class="text-xs mb-2">Transaction Type:</div>
          <div class="flex justify-between">
            <div class="flex items-center cursor-pointer">
              <select class="cursor-pointer outline-none hover:bg-blue-50 p-2 pl-0 transition-all duration-200 rounded-lg" v-model="hashType">
                <option value="BSC">BSC Transaction Hash</option>
                <option value="ETH">ETH Transaction Hash</option>
                <option value="Sirius">Sirius Transaction Hash</option>
              </select>
            </div>
            <div>
              <div>
              </div>
            </div>
          </div>
        </div>

        <div class="w-full mt-5">
          <div class="border border-gray-200 px-2 py-2 rounded-md">
            <div class="flex gap-2">
              <div class="flex flex-col w-full">
                <div class="uppercase text-gray-500 font-light text-txs text-left mb-1.5">{{ hashType }} Transaction Hash</div>
                <input type="text" v-model="transactionHash"  class="w-full font-semibold text-tsm outline-none ">
              </div>
            </div>
          </div>
        </div>
        <div class="flex justify-center mt-10">
          <button class="blue-btn font-semibold py-2 cursor-pointer text-center w-32 disabled:opacity-50 disabled:cursor-auto flex items-center px-3 justify-center" :disabled="disabledCheckStatus" @click="checkStatus()">
            <div style="border-top-color:transparent" class="inline-block mr-2 relative top-2 w-4 h-4 border-4 border-blue-200 border-solid rounded-full animate-spin" v-if="isLoaded"></div>
            Check Status
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch, shallowRef } from "vue";
import { useRoute } from "vue-router";
import { networkState } from "@/state/networkState";
import { ChainSwapConfig } from "@/models/stores/chainSwapConfig";
import { useI18n } from 'vue-i18n';
import { SwapUtils } from '@/util/swapUtils';
import { Helper } from "@/util/typeHelper";
import { AppState } from "@/state/appState";


export default {
  name: "ViewServicesStableCoinsCheckStatus",

  setup(){

    const {t} = useI18n();
    const route = useRoute();

    const isLoaded = shallowRef(false);
    const statusNotificationClassStyle = ref('');

    let swapData;

    const init = async() =>{
      swapData= new ChainSwapConfig(networkState.chainNetworkName);
      swapData.init();
    }
    
    if(AppState.isReady){
      init();
    }else{
      let readyWatcher = watch(AppState, (value) => {
        if(value.isReady){
          init();
          readyWatcher();
        }
      });
    }

    const customErrorMessage = ref('');
    const transactionHash = ref('');
    const hashType = ref('BSC');
    const remoteNetwork = ref('BSC');

    const disabledCheckStatus = computed(() => {
      if(isLoaded.value){
        return true;
      }
      if(hashType.value == 'BSC'){
        // check for BSC txn type
        if(transactionHash.value.length == 66){
          if(transactionHash.value.substring(0, 2) === '0x'){
            return false
          }
          return true;
        }else{
          return true;
        }
      }else if(hashType.value == 'ETH'){
        // check for ETH txn type
        if(transactionHash.value.length == 66){
          if(transactionHash.value.substring(0, 2) === '0x'){
            return false
          }
          return true;
        }else{
          return true;
        }
      }else{
        // check for sirius hash
        if(transactionHash.value.length == 64){
          return false;
        }else{
          return true;
        }
      }
    });

    const isSuccess = shallowRef(false);

    const amount = ref('');
    const siriusAddress = ref('');
    const siriusTransactionHash = ref('');
    const remoteTxnHash = ref('');
    const txnStatus = ref('');
    const remoteTxnStatus = ref('');
    const siriusTxnStatus = ref('');
    const time = ref('');
    const explorerLink = () =>{
      if(!networkState.currentNetworkProfile){
        return ''
      }
      return networkState.currentNetworkProfile.chainExplorer.url + '/' + networkState.currentNetworkProfile.chainExplorer.hashRoute + '/';
    }
    const remoteExplorerLink = ref('');

    const checkStatus = async() => {
      isLoaded.value = true;
      isSuccess.value = false;
      customErrorMessage.value = '';

      try {
        let url = '';
        if(hashType.value == 'BSC'){
          url = SwapUtils.getIncoming_BSCBuySiriusTokenCheckRemoteStatus_URL(swapData.swap_IN_SERVICE_URL, 'bsc', transactionHash.value);
        }
        else if(hashType.value == 'ETH'){
          url = SwapUtils.getIncoming_BSCBuySiriusTokenCheckRemoteStatus_URL(swapData.swap_IN_SERVICE_URL, 'eth', transactionHash.value);
        }
        else{
          url = SwapUtils.getIncoming_BSCBuySiriusTokenCheckStatus_URL(swapData.swap_IN_SERVICE_URL, transactionHash.value);
        }
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if(response.status == 200){ // data.status == 'fulfilled'
        const json = await response.json();
          remoteTxnHash.value = json.remoteTxnHash;
          remoteNetwork.value = json.network;
          remoteExplorerLink.value = remoteNetwork.value === 'BSC'?swapData.BSCScanUrl:swapData.ETHScanUrl;
          if(json.siriusTxnHash){
            siriusTransactionHash.value = json.siriusTxnHash;
            remoteTxnStatus.value = 'SUCCESS';
            try{
              if(AppState.isReady){
                let siriusTxn = await AppState.chainAPI.transactionAPI.getTransactionStatus(json.siriusTxnHash);
                if(siriusTxn.group == 'partial' || siriusTxn.group == 'unconfirmed'){
                  siriusTxnStatus.value = 'PENDING';
                  statusNotificationClassStyle.value = 'pending_box pending';
                }else if(siriusTxn.group == 'confirmed'){
                  siriusTxnStatus.value = 'SUCCESS';
                  statusNotificationClassStyle.value = 'success_box success';
                }else{
                  siriusTxnStatus.value = 'FAILED';
                  statusNotificationClassStyle.value = 'error_box error';
                }
              }
            }catch(err){
              siriusTxnStatus.value = 'Sirius Transaction NOT FOUND. Please check again within 30 seconds if it is a new swap.';
              statusNotificationClassStyle.value = 'error_box error';
            }
          }else{
            if(json.status == 'pending'){
              remoteTxnStatus.value = 'PENDING';
              statusNotificationClassStyle.value = 'pending_box pending';
            }else if(json.status == 'pending_confirmations' || json.status == 'pending_wallet'){
              remoteTxnStatus.value = 'PENDING - ' + json.status;
              statusNotificationClassStyle.value = 'pending_box pending';
            }else if(json.status == 'invalid' || json.status == 'cut_off_passed' || json.status == 'nothing_to_send'){
              remoteTxnStatus.value = 'ERROR - ' + json.status;
              statusNotificationClassStyle.value = 'error_box error';
            }else if(json.status == 'complete'){
              remoteTxnStatus.value = 'SUCCESS';
              siriusTxnStatus.value = 'PENDING';
              statusNotificationClassStyle.value = 'pending_box pending';
            }
          }
          siriusAddress.value = Helper.createAddress(json.siriusAddress).pretty();
          amount.value = Helper.convertToCurrency(json.receiveAmount, 0) + ' ' + json.toToken;
          let date = new Date(json.timeStamp);
          time.value = date.toLocaleTimeString();
          isSuccess.value = true;
          isLoaded.value = false;
        }
        else if(response.status == 400){
          customErrorMessage.value = 'Transaction not found. This transaction hash is not a valid swap transaction.';
          isLoaded.value = false;
        }else if(response.status == 404){
          customErrorMessage.value = 'Transaction not found. This transaction hash is not a valid swap transaction.';
          isLoaded.value = false;
        }
      }catch(err){
        console.log(err)
        customErrorMessage.value = 'Failed to check transaction. Please try again later.';
        isLoaded.value = false;
      }
    };


    return {
      statusNotificationClassStyle,
      amount,
      explorerLink,
      remoteExplorerLink,
      remoteTxnHash,
      siriusTransactionHash,
      hashType,
      transactionHash,
      disabledCheckStatus,
      customErrorMessage,
      siriusAddress,
      checkStatus,
      remoteTxnStatus,
      siriusTxnStatus,
      time,
      isSuccess,
      isLoaded,
      remoteNetwork
    }
  }
}
</script>
<style scoped lang="scss">
.slide-enter-active {
  -moz-transition-duration: 0.3s;
  -webkit-transition-duration: 0.3s;
  -o-transition-duration: 0.3s;
  transition-duration: 0.3s;
  -moz-transition-timing-function: ease-in-out;
  -webkit-transition-timing-function: ease-in-out;
  -o-transition-timing-function: ease-in-out;
  transition-timing-function: ease-in-out;
}

.slide-leave-active {
  -moz-transition-duration: 0.3s;
  -webkit-transition-duration: 0.3s;
  -o-transition-duration: 0.3s;
  transition-duration: 0.3s;
  -moz-transition-timing-function: cubic-bezier(0, 1, 0.5, 1);
  -webkit-transition-timing-function: cubic-bezier(0, 1, 0.5, 1);
  -o-transition-timing-function: cubic-bezier(0, 1, 0.5, 1);
  transition-timing-function: cubic-bezier(0, 1, 0.5, 1);
}

.slide-enter-to,
.slide-leave-from {
  max-height: 500px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  overflow: hidden;
  max-height: 0;
}
</style>