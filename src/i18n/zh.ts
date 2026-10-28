export const zh = {
  app: { name: "跨境物流价卡计算器" },
  nav: { label: "主导航", open: "打开导航", calculator: "报价计算", maintenance: "价卡维护" },
  common: { close: "关闭", cancel: "取消", save: "保存", create: "新增", delete: "删除", edit: "编辑", confirm: "确认", clear: "清除筛选", all: "全部", noData: "—" },
  theme: { toggle: "切换主题" },
  locale: { toggle: "切换语言" },
  auth: { loading: "正在验证访问权限", signedOut: "未登录", unauthorizedTitle: "无访问权限", unauthorizedDescription: "当前账号没有此应用的访问权限，请联系应用负责人开通。", relogin: "重新登录" },
  calculator: {
    title: "报价计算", description: "按实重、体积重与价卡规则返回所有可行渠道。", formTitle: "货件信息", calculate: "计算报价", dataLoading: "正在同步最新价卡，请稍候。", dataFallback: "最新价卡暂时加载失败，当前使用内置备份数据。", retryData: "重新同步",
    category: "品类", weight: "实重", weightUnit: "实重单位", lengthCm: "长（cm）", widthCm: "宽（cm）", heightCm: "高（cm）", calculatedVolume: "自动计算方数", dimensionsDetail: "长 × 宽 × 高", destination: "目的国/地区", transportMode: "运输方式", air: "空运", sea: "海运", provider: "服务商", providers: "服务商（可多选）", selectAllProviders: "全选服务商", clearProviders: "清空", selectedProviders: "已选 {count} 家", channel: "渠道（可选）",
    m3: "m³ / 方", dimensionsMode: "长 × 宽 × 高", kg: "kg", g: "g", select: "请选择", allChannels: "全部渠道", required: "请至少选择一家服务商，完整填写必填项，并输入大于 0 的实重、长、宽、高。",
    serviceTitle: "3PL 报价", officialTitle: "官方价卡", comparisonTitle: "官方报价对比", comparisonDescription: "以最低可行 3PL 报价与最低官方参考价进行对比。", comparisonBest3pl: "最低 3PL 报价", comparisonOfficial: "官方参考价", comparisonSaving: "较官方节省", comparisonPremium: "较官方高出", comparisonUnavailable: "当前缺少可比较的 3PL 或官方报价。", quoteCount: "{count} 个可行渠道", noService: "没有可行的 3PL 报价", noServiceDesc: "匹配到的价卡均不满足计费区间、限重或费用字段要求。", noOfficial: "该目的地没有官方价卡。",
    amount: "报价", chargedWeight: "计费重", billingQuantity: "基础计费量", volumeWeight: "体积重", transit: "时效", limit: "单票限重", restriction: "限制", dataHint: "数据提示", formula: "计费公式", officialReferenceShort: "官方参考价 {amount}", serviceVsOfficialLower: "该 3PL 比官方参考价低 {amount}", officialVsServiceLower: "官方参考价比该 3PL 低 {amount}", noProviderMatch: "未匹配到该服务商的品类、目的地或渠道价卡。",
    fallbackWeightRule: "源表未给出计费重量口径，谨慎按实重与体积重取大。", categoryFromChannel: "品类由渠道名包含关系匹配；源品类字段未改动。", blankCategory: "源品类为空，作为低优先级候选。", normalizedDestination: "目的地按马来西亚与西马/东马兼容匹配；未改动源值。",
    rateFormula: "计费重 × 每 KG 单价 + 操作费", tierFormula: "命中重量区间后：计费重 × 区间单价 + 操作费", firstFormula: "首重费 + ceil(超出首重 ÷ 续重单位) × 续重费",
    overLimit: "{provider} / {channel}：计费重 {weight} kg 超过单票限重 {limit} kg。", outsideBand: "{provider} / {channel}：计费重不在该价卡区间。", missingRate: "{provider} / {channel}：数据被阻断或缺少必要费用字段。", conflict: "{provider} / {channel}：同时命中多个计费档位，已阻断报价。",
    officialFormula: "起重价格 + ceil(max(0, 实重g − 起重重量g) ÷ 10g) × 续重价格", referenceRateNote: "参考汇率，可在本次计算中临时调整。", exchange: "本次参考汇率：1 {currency} = X RMB", temporaryOverride: "默认使用内置参考汇率，可仅覆盖本次计算。", rateUsed: "使用汇率：1 {currency} = {rate} RMB", officialLower: "官方报价更低 {amount}", serviceLower: "最低 3PL 报价更低 {amount}", regionPrompt: "马来西亚未指定地区，官方报价同时列出西马与东马。", feeDisclaimer: "费用提示：官方价卡为空运价卡。以上报价仅包含标准运输费用，不含 POD（签收证明）、保险等附加服务。请根据实际需求另行购买；高价值货物建议投保，以降低运输风险及潜在损失。",
  },
  maintenance: {
    title: "价卡维护", description: "云端规范化价卡为 3PL 报价权威来源；单条临时调整不会覆盖云端版本。", upload: "上传更新价卡", uploadTitle: "上传更新价卡", uploadDescription: "先校验并预览，确认后原子替换当前 3PL 数据。", dropFiles: "拖拽文件到此处，或点击选择", fileRule: "一次选择 1-5 个 .xlsx，单文件不超过 8 MiB", validate: "校验价卡", confirmPublish: "确认发布", validationFailed: "价卡校验失败", publishFailed: "发布失败，旧版本未被覆盖", publishSuccess: "价卡已确认发布", previewReady: "校验完成。阻断行不会进入自动报价，其余数据可确认发布。", retry: "重试",
    serviceTab: "服务商价卡", officialTab: "官方价卡与汇率", search: "搜索服务商、国家、渠道或品类", providerFilter: "筛选服务商", total: "共 {count} 条", loadError: "无法读取云端价卡，当前已回退到内置种子。", emptyTitle: "还没有价卡", noResultsTitle: "没有匹配的价卡",
    provider: "服务商", providers: "服务商数", destination: "国家/地区", channel: "渠道", category: "品类", billingMode: "计费模式", status: "状态", blocked: "已阻断", warning: "有提示", ready: "可计算", perKg: "每 KG + 操作费", tieredPerKg: "重量分段每 KG + 操作费", firstIncrement: "首重 + 续重", perCbm: "按 CBM", referenceOnly: "仅供参考",
    version: "当前版本", updatedAt: "变更时间", rows: "总行数", computable: "可计算数", blockers: "阻断数", warnings: "警告数", sourceRow: "源表第 {row} 行",
    referenceRates: "参考汇率", rateLabel: "1 {currency} = RMB", saveRates: "保存参考汇率", restoreRates: "恢复默认汇率", ratesSaved: "参考汇率已保存", country: "国家", region: "地区", currency: "币种",
  },
  notFound: { title: "页面不存在", description: "链接可能已失效，或页面已被移除。", back: "返回报价计算" },
};

export type Messages = typeof zh;
