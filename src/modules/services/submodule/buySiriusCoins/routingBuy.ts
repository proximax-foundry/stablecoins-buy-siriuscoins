export const BuyRoutes = [
  {
    path: '/',
    name: 'ViewServicesStableCoinsBuy',
    component: () => import('@/modules/services/submodule/buySiriusCoins/views/ViewServicesStableCoinsBuy.vue'),
    meta: {
      title: "Buy",
    }
  },

  {
    path: '/check-status',
    name: 'ViewServicesStableCoinsCheckStatus',
    component: () => import('@/modules/services/submodule/buySiriusCoins/views/ViewServicesStableCoinsCheckStatus.vue'),
    meta: {
      title: "Check Status",
    }
  },
];

