import { useState, useEffect } from "react";
import {
  Search, ShoppingCart, Package, User, LayoutDashboard, Plus, Minus,
  Trash2, Check, Truck, Clock, ChevronRight, ChevronLeft, Store, Users,
  ClipboardList, Wallet, Globe, Coins, Mic, Bell, Camera, X
} from "lucide-react";

const BHD_PER_SAR = 0.0997; // approximate peg-based rate, base prices are stored in SAR
const API_BASE = "https://parts-mart-backend-production-cac5.up.railway.app/api"; // deployed backend on Railway

const T = {
  ar: {
    appName: "Parts Mart", customerTab: "العميل", adminTab: "الإدارة", supplierTab: "المورد",
    supplierLoginTitle: "تسجيل دخول المورد", supplierLoginNote: "بيانات الدخول هذه تُعطى للمورد ليستخدمها في بوابته الخاصة",
    myProfileTab: "بياناتي", myProductsTab: "منتجاتي", addPartTab: "إضافة قطعة", myRequestsTab: "طلباتي",
    noMyProducts: "لا توجد قطع مسجَّلة باسمك حاليًا", requestTypeUpdatePart: "تعديل قطعة",
    requestProfileUpdate: "إرسال طلب تحديث", manufacturerLabel: "شركة الصنع", carTypeField: "نوع السيارة",
    carMakeField: "ماركة السيارة", cylindersLabel: "عدد الأسطوانات", engineSizeLabel: "حجم المحرك",
    reqPending: "قيد المراجعة", reqApproved: "معتمد", reqRejected: "مرفوض", reqReturned: "مرتجع للتعديل",
    reviewNotePh: "ملاحظة (اختياري)", approveBtn: "اعتماد", rejectBtn: "رفض", returnBtn: "إرجاع للتعديل",
    resubmitBtn: "تعديل وإعادة الإرسال", adminSupplierRequestsTab: "طلبات الموردين",
    noSupplierRequests: "لا توجد طلبات من الموردين حتى الآن", requestTypeProfile: "تحديث بيانات",
    requestTypeNewPart: "قطعة جديدة", myRequestsEmpty: "لا توجد طلبات مُرسلة بعد",
    requestSentNote: "أُرسل طلبك للإدارة للمراجعة، سيصلك إشعار بالنتيجة هنا في طلباتي",
    adminLoginTitle: "تسجيل دخول الإدارة", username: "اسم المستخدم", password: "كلمة المرور",
    loginBtn: "دخول", loginError: "اسم المستخدم أو كلمة المرور غير صحيحة", loginFillFields: "الرجاء تعبئة الحقلين",
    navHome: "الرئيسية", navSearch: "بحث", navCart: "السلة", navOrders: "طلباتي",
    welcome: (n) => `أهلاً ${n}`, heroTitle: "ابحث عن أي قطعة غيار",
    heroSubtitle: "أدخل نوع سيارتك وموديلها لنعرض لك أفضل الأسعار من موردين موثوقين",
    snapSendTitle: "صوّر وطرش", snapSendDesc: "صوّر القطعة التي تبحث عنها وأرسلها، وسنقوم بتوفيرها",
    quantityField: "عدد القطع المطلوبة", optionalField: "اختياري", sendingLabel: "جارِ الإرسال...",
    photoRequestSentTitle: "تم إرسال طلبك", photoRequestSentBody: "طلبك الآن قيد التنفيذ، وسنُعلمك فور توفّره.",
    photoReqPending: "قيد التنفيذ", photoReqSentToSuppliers: "أُرسل للموردين",
    startSearch: "ابدأ البحث", registerBanner: "سجّل حسابك لمتابعة طلباتك",
    statSuppliers: "مورد قطع غيار", statHidden: "هوية مخفية", statHiddenSub: "حماية بيانات الموردين",
    registerTitle: "تسجيل حساب جديد", fullName: "الاسم الكامل", namePh: "مثال: أحمد السالم",
    phone: "رقم الجوال", phonePh: "05xxxxxxxx", fillFields: "الرجاء تعبئة كل الحقول",
    loginTitle: "تسجيل الدخول", emailLabel: "البريد الإلكتروني", usernameTaken: "اسم المستخدم هذا محجوز، اختر اسمًا آخر",
    emailTaken: "هذا البريد الإلكتروني مُستخدَم بالفعل لحساب آخر",
    noAccountYet: "ليس لديك حساب؟", createAccountLink: "سجّل الآن", haveAccountAlready: "لديك حساب بالفعل؟", loginLink: "سجّل الدخول", logoutBtn: "تسجيل الخروج",
    emailNotVerified: "لم يتم تأكيد بريدك الإلكتروني بعد", resendVerification: "إعادة إرسال رسالة التأكيد",
    verificationResent: "أُعيد إرسال رسالة التأكيد إلى بريدك",
    checkEmailTitle: "تحقق من بريدك الإلكتروني", checkEmailBody: (e) => `أرسلنا رابط تأكيد إلى ${e}. اضغط الرابط لتفعيل حسابك ثم سجّل الدخول.`,
    createAccount: "إنشاء الحساب",
    searchPh: "اسم القطعة أو الموديل", allMakes: "الكل", noResults: "لا توجد نتائج مطابقة",
    listening: "جارِ الاستماع... تحدث الآن", micUnsupported: "المتصفح الحالي لا يدعم البحث الصوتي",
    micPermissionDenied: "الرجاء السماح بالوصول للمايك من إعدادات المتصفح ثم أعد المحاولة",
    micNoSpeech: "لم يُسمَع أي صوت، حاول التحدث مرة أخرى", micGenericError: "حدث خطأ أثناء البحث الصوتي، حاول مرة أخرى",
    heardPrefix: (s) => `سمعت: "${s}"`,
    searchCarMake: "نوع السيارة", searchCarModel: "موديل السيارة", searchYear: "سنة الصنع",
    searchPartNumber: "رقم القطعة", searchPartName: "اسم القطعة", voiceSearchAll: "ابحث بالصوت في كل الخانات دفعة واحدة",
    aiAnalyzing: "جارِ تحليل الصوت بالذكاء الاصطناعي...", aiError: "تعذّر تحليل الصوت، حاول مجدداً أو أدخل البيانات يدوياً",
    cameraSearch: "صوّر القطعة ليتم التعرف عليها تلقائياً", aiAnalyzingImage: "جارِ تحليل الصورة بالذكاء الاصطناعي...",
    vinLabel: "رقم الشاصي (VIN) — الأدق لتحديد سيارتك بالضبط", vinPlaceholder: "١٧ رمزًا",
    vinDecodeBtn: "فك التشفير", vinDecoding: "جارِ التحقق من رقم الشاصي...",
    vinError: "تعذّر التعرف على هذا الرقم، تأكد من كتابته بشكل صحيح (17 رمزًا)", vinAttached: "رقم الشاصي المرفق",
    vinApproximate: "معلومة تقريبية من الرقم نفسه (السيارة غير مسجّلة في القاعدة الأمريكية) — يُفضّل تأكيد الموديل يدويًا",
    aiImageError: "تعذّر التعرف على القطعة من الصورة، جرّب صورة أوضح أو أدخل البيانات يدوياً",
    noPartsNotice: "لم نجد هذه القطعة حالياً، لكننا سنعمل على توفيرها في أقرب وقت ممكن.",
    requestPartTitle: "اطلب توفير هذه القطعة", requestPartName: "اسم القطعة", requestCarType: "نوع السيارة",
    requestYear: "سنة الصنع", requestCustomerName: "اسمك", requestPhone: "رقم الهاتف",
    requestEmail: "البريد الإلكتروني", submitRequest: "إرسال الطلب",
    requestSuccessMsg: "تم استلام طلبك، وسنُعلمك فور توفير القطعة.",
    requestFillFields: "الرجاء تعبئة جميع الحقول",
    partRequestsTab: "طلبات ناقصة", noPartRequests: "لا توجد طلبات قطع غير متوفرة حالياً",
    photoRequestsTab: "طلبات التصوير", noPhotoRequests: "لا توجد طلبات تصوير حتى الآن",
    sendToSuppliersBtn: "إرسال الطلب إلى الموردين", chooseSuppliersTitle: "اختر الموردين",
    noSupplierEmail: "لا يوجد بريد إلكتروني", confirmSendBtn: "تأكيد الإرسال",
    sendSuccessAll: "تم إرسال البريد لجميع الموردين المختارين بنجاح.",
    sendFailedAll: "تعذّر إرسال البريد لأي مورد. تحقق من إعداد Resend والبريد الإلكتروني المسجَّل لهم.",
    sendPartialFail: (failed, total) => `تعذّر الإرسال لـ ${failed} من أصل ${total} موردين. تحقق من بريدهم الإلكتروني.`,
    markFulfilled: "تحديد كمتوفرة الآن", fulfilledBadge: "تم التوفير", pendingBadge: "قيد الانتظار",
    back: "رجوع للبحث", compatibleWith: (m, mo, y) => `متوافقة مع ${m} ${mo} (${y})`,
    condition: "الحالة", availability: "التوفر", availableNow: "متوفرة الآن",
    deliveryEst: "التوصيل المتوقع", deliveryDays: "2-4 أيام عمل", addToCart: "أضف للسلة",
    emptyCart: "سلتك فارغة حالياً", browseParts: "تصفّح القطع", total: "الإجمالي",
    confirmOrder: "تأكيد الطلب", loginToOrder: "سجّل الدخول لإتمام الطلب",
    paymentNote: "الدفع الإلكتروني سيُفعّل في مرحلة لاحقة — الطلب يُسجَّل الآن كطلب مبدئي",
    noOrders: "لا توجد طلبات حتى الآن", partsCount: (n) => `${n} قطعة`,
    overview: "نظرة عامة", ordersTab: "الطلبات", partsTab: "القطع", suppliersTab: "الموردون", customersTab: "العملاء",
    totalCommission: "إجمالي العمولات", totalSales: "إجمالي المبيعات", suppliersCount: "الموردون",
    availableParts: "القطع المتاحة", customersCount: "العملاء", ongoingOrders: "طلبات جارية",
    customerLabel: "العميل", totalColon: "الإجمالي", commissionColon: "عمولتك", nextStage: "نقل للمرحلة التالية",
    addNewPart: "إضافة قطعة جديدة", partName: "اسم القطعة", make: "الماركة", model: "الموديل",
    aliasesLabel: "أسماء بديلة (افصل بينها بفاصلة)", aliasesPh: "مثال: فرامل، شوزات، بريك باد",
    years: "السنوات", price: "السعر", supplier: "المورد", uploadImage: "صورة القطعة",
    changeImage: "تغيير الصورة", uploadFromDevice: "رفع صورة من الجهاز", removeImage: "إزالة الصورة",
    addPartBtn: "إضافة القطعة",
    createSupplierTitle: "إنشاء حساب مورد جديد",
    noSelfRegNote: "لا يوجد تسجيل ذاتي للموردين — الإدارة فقط من تُنشئ الحسابات وتمنحهم بيانات الدخول.",
    shopName: "اسم المحل", city: "المدينة", contactNumber: "رقم التواصل", fillShopFields: "الرجاء تعبئة اسم المحل ورقم التواصل",
    createAccountBtn: "إنشاء الحساب", hiddenIdentityNote: "هوية الموردين مرئية هنا فقط، ولا تظهر أبداً لواجهة العميل.",
    editBtn: "تعديل", editSupplierTitle: "تعديل بيانات المورد", newPasswordPh: "كلمة مرور جديدة (اتركها فارغة لعدم التغيير)", saveBtn: "حفظ التعديلات",
    deleteBtn: "حذف", confirmDeleteSupplier: (name) => `هل أنت متأكد من حذف المورد "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
    editPartTitle: "تعديل القطعة",
    noCustomers: "لا يوجد عملاء مسجّلون بعد", customerDetailsTitle: "بيانات العميل",
    language: "اللغة", currency: "العملة", arabic: "عربي", english: "English",
    sar: "ريال سعودي", bhd: "دينار بحريني",
    apiOffline: "تعذّر الاتصال بالخادم. تأكد أن الخادم يعمل محلياً (node server.js) على المنفذ 3001.",
    stages: ["قيد المراجعة", "تم التأكيد", "تم الشحن", "تم التسليم"],
  },
  en: {
    appName: "Parts Mart", customerTab: "Customer", adminTab: "Admin", supplierTab: "Supplier",
    supplierLoginTitle: "Supplier Login", supplierLoginNote: "These login details are given to the supplier for their own portal",
    myProfileTab: "My Profile", myProductsTab: "My Products", addPartTab: "Add Part", myRequestsTab: "My Requests",
    noMyProducts: "You don't have any listed parts yet", requestTypeUpdatePart: "Part update",
    requestProfileUpdate: "Submit update request", manufacturerLabel: "Manufacturer", carTypeField: "Car type",
    carMakeField: "Car make", cylindersLabel: "Number of cylinders", engineSizeLabel: "Engine size",
    reqPending: "Pending review", reqApproved: "Approved", reqRejected: "Rejected", reqReturned: "Returned for edits",
    reviewNotePh: "Note (optional)", approveBtn: "Approve", rejectBtn: "Reject", returnBtn: "Return for edits",
    resubmitBtn: "Edit and resubmit", adminSupplierRequestsTab: "Supplier Requests",
    noSupplierRequests: "No supplier requests yet", requestTypeProfile: "Profile update",
    requestTypeNewPart: "New part", myRequestsEmpty: "No requests submitted yet",
    requestSentNote: "Your request was sent to Admin for review — you'll see the result here in My Requests",
    adminLoginTitle: "Admin Login", username: "Username", password: "Password",
    loginBtn: "Log in", loginError: "Incorrect username or password", loginFillFields: "Please fill in both fields",
    navHome: "Home", navSearch: "Search", navCart: "Cart", navOrders: "Orders",
    welcome: (n) => `Welcome ${n}`, heroTitle: "Find any spare part",
    heroSubtitle: "Enter your car's make and model to see the best prices from trusted suppliers",
    snapSendTitle: "Snap & Send", snapSendDesc: "Photograph the part you need and send it — we'll source it for you",
    quantityField: "Quantity needed", optionalField: "optional", sendingLabel: "Sending...",
    photoRequestSentTitle: "Request sent", photoRequestSentBody: "Your request is now in progress — we'll notify you once it's ready.",
    photoReqPending: "In progress", photoReqSentToSuppliers: "Sent to suppliers",
    startSearch: "Start searching", registerBanner: "Sign up to track your orders",
    statSuppliers: "spare part suppliers", statHidden: "Identity hidden", statHiddenSub: "Supplier data is protected",
    registerTitle: "Create a new account", fullName: "Full name", namePh: "e.g. Ahmed Al-Salem",
    phone: "Mobile number", phonePh: "05xxxxxxxx", fillFields: "Please fill in all fields",
    loginTitle: "Log In", emailLabel: "Email", usernameTaken: "This username is taken, choose another one",
    emailTaken: "This email is already registered to another account",
    noAccountYet: "Don't have an account?", createAccountLink: "Sign up", haveAccountAlready: "Already have an account?", loginLink: "Log in", logoutBtn: "Log out",
    emailNotVerified: "Your email hasn't been verified yet", resendVerification: "Resend confirmation email",
    verificationResent: "Confirmation email resent",
    checkEmailTitle: "Check your email", checkEmailBody: (e) => `We sent a confirmation link to ${e}. Click it to activate your account, then log in.`,
    createAccount: "Create account",
    searchPh: "Part name or model", allMakes: "All", noResults: "No matching results",
    listening: "Listening... speak now", micUnsupported: "This browser doesn't support voice search",
    micPermissionDenied: "Please allow microphone access in your browser settings, then try again",
    micNoSpeech: "No speech was heard, try speaking again", micGenericError: "Something went wrong with voice search, try again",
    heardPrefix: (s) => `Heard: "${s}"`,
    searchCarMake: "Car make", searchCarModel: "Car model", searchYear: "Year of manufacture",
    searchPartNumber: "Part number", searchPartName: "Part name", voiceSearchAll: "Voice search across all fields at once",
    aiAnalyzing: "Analyzing your voice with AI...", aiError: "Couldn't analyze the audio, try again or enter details manually",
    cameraSearch: "Take a photo of the part to auto-identify it", aiAnalyzingImage: "Analyzing the photo with AI...",
    vinLabel: "VIN (Chassis Number) — most accurate way to identify your car", vinPlaceholder: "17 characters",
    vinDecodeBtn: "Decode", vinDecoding: "Checking the VIN...",
    vinError: "Couldn't recognize this VIN, make sure it's entered correctly (17 characters)", vinAttached: "Attached VIN",
    vinApproximate: "Approximate info decoded from the VIN itself (not registered in the US database) — please confirm the model manually",
    aiImageError: "Couldn't identify the part from that photo, try a clearer shot or enter details manually",
    noPartsNotice: "We couldn't find this part right now, but we'll work on sourcing it as soon as possible.",
    requestPartTitle: "Request this part", requestPartName: "Part name", requestCarType: "Car type",
    requestYear: "Year of manufacture", requestCustomerName: "Your name", requestPhone: "Phone number",
    requestEmail: "Email", submitRequest: "Submit request",
    requestSuccessMsg: "Your request has been received. We'll notify you once the part is available.",
    requestFillFields: "Please fill in all fields",
    partRequestsTab: "Missing requests", noPartRequests: "No unavailable-part requests yet",
    photoRequestsTab: "Photo Requests", noPhotoRequests: "No photo requests yet",
    sendToSuppliersBtn: "Send request to suppliers", chooseSuppliersTitle: "Choose suppliers",
    noSupplierEmail: "No email on file", confirmSendBtn: "Confirm send",
    sendSuccessAll: "Email sent successfully to all selected suppliers.",
    sendFailedAll: "Couldn't send email to any supplier. Check your Resend setup and their registered emails.",
    sendPartialFail: (failed, total) => `Couldn't send to ${failed} of ${total} suppliers. Check their email addresses.`,
    markFulfilled: "Mark as fulfilled", fulfilledBadge: "Fulfilled", pendingBadge: "Pending",
    back: "Back to search", compatibleWith: (m, mo, y) => `Compatible with ${m} ${mo} (${y})`,
    condition: "Condition", availability: "Availability", availableNow: "Available now",
    deliveryEst: "Estimated delivery", deliveryDays: "2-4 business days", addToCart: "Add to cart",
    emptyCart: "Your cart is empty", browseParts: "Browse parts", total: "Total",
    confirmOrder: "Confirm order", loginToOrder: "Sign in to complete order",
    paymentNote: "Online payment will be enabled in a later phase — this order is now recorded as a preliminary request",
    noOrders: "No orders yet", partsCount: (n) => `${n} item(s)`,
    overview: "Overview", ordersTab: "Orders", partsTab: "Parts", suppliersTab: "Suppliers", customersTab: "Customers",
    totalCommission: "Total commissions", totalSales: "Total sales", suppliersCount: "Suppliers",
    availableParts: "Available parts", customersCount: "Customers", ongoingOrders: "Ongoing orders",
    customerLabel: "Customer", totalColon: "Total", commissionColon: "Your commission", nextStage: "Move to next stage",
    addNewPart: "Add new part", partName: "Part name", make: "Make", model: "Model",
    aliasesLabel: "Alternate names (comma-separated)", aliasesPh: "e.g. brake shoes, brake pads",
    years: "Years", price: "Price", supplier: "Supplier", uploadImage: "Part image",
    changeImage: "Change image", uploadFromDevice: "Upload from device", removeImage: "Remove image",
    addPartBtn: "Add part",
    createSupplierTitle: "Create a new supplier account",
    noSelfRegNote: "There is no supplier self-registration — only Admin can create accounts and issue login details.",
    shopName: "Shop name", city: "City", contactNumber: "Contact number", fillShopFields: "Please fill in the shop name and contact number",
    createAccountBtn: "Create account", hiddenIdentityNote: "Supplier identity is only visible here, and is never shown on the customer app.",
    editBtn: "Edit", editSupplierTitle: "Edit Supplier", newPasswordPh: "New password (leave blank to keep unchanged)", saveBtn: "Save changes",
    deleteBtn: "Delete", confirmDeleteSupplier: (name) => `Are you sure you want to delete supplier "${name}"? This action cannot be undone.`,
    editPartTitle: "Edit Part",
    noCustomers: "No customers registered yet", customerDetailsTitle: "Customer Details",
    language: "Language", currency: "Currency", arabic: "عربي", english: "English",
    sar: "Saudi Riyal", bhd: "Bahraini Dinar",
    apiOffline: "Couldn't reach the server. Make sure the backend is running locally (node server.js) on port 3001.",
    stages: ["Pending review", "Confirmed", "Shipped", "Delivered"],
  },
};

// Scores how well a searched year matches a part's supported year range (e.g. "2018-2022").
function yearScore(query, rangeStr) {
  const q = parseInt(String(query).replace(/\D/g, ""), 10);
  const nums = (String(rangeStr).match(/\d+/g) || []).map(Number);
  if (!isNaN(q) && nums.length) {
    const min = Math.min(...nums), max = Math.max(...nums);
    if (q >= min && q <= max) return 1;
    const dist = q < min ? min - q : q - max;
    return Math.max(0, 1 - dist / 8);
  }
  return fuzzyScore(String(query), String(rangeStr));
}

function L(field, lang) {
  return field && typeof field === "object" ? field[lang] : field;
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function wordSimilarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.95;
  const maxLen = Math.max(a.length, b.length);
  return 1 - levenshtein(a, b) / maxLen;
}

// Scores how close a spoken/typed query is to a part's name/model/make,
// even if the query is a full sentence rather than an exact match.
function fuzzyScore(query, fieldsText) {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const qTokens = q.split(/\s+/).filter(Boolean);
  const tTokens = fieldsText.toLowerCase().split(/\s+/).filter(Boolean);
  let best = 0;
  for (const qt of qTokens) {
    for (const tt of tTokens) {
      best = Math.max(best, wordSimilarity(qt, tt));
    }
  }
  return best;
}

function formatPrice(sarAmount, currency, lang) {
  if (currency === "BHD") {
    const val = sarAmount * BHD_PER_SAR;
    return lang === "ar" ? `${val.toFixed(3)} د.ب` : `BHD ${val.toFixed(3)}`;
  }
  return lang === "ar" ? `${sarAmount.toLocaleString("ar")} ر.س` : `SAR ${sarAmount.toLocaleString("en")}`;
}

const COMMISSION_RATE = 0.1;

export default function App() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 900 : false
  );

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 900);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [lang, setLang] = useState("ar");
  const [currency, setCurrency] = useState("BHD");
  const [role, setRole] = useState("customer");
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [supplierRequests, setSupplierRequests] = useState([]);
  const [screen, setScreen] = useState("home");
  const [customers, setCustomers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [parts, setParts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [newSupplier, setNewSupplier] = useState({ name: "", city: "", phone: "", email: "", username: "", password: "" });
  const [supplierError, setSupplierError] = useState("");
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [search, setSearch] = useState({ partName: "", carMake: "", carModel: "", year: "", partNumber: "" });
  const [vin, setVin] = useState("");
  const [vinInfo, setVinInfo] = useState(null);
  const [partRequests, setPartRequests] = useState([]);
  const [photoRequests, setPhotoRequests] = useState([]);
  const [regForm, setRegForm] = useState({ username: "", password: "", name: "", phone: "", email: "" });
  const [regError, setRegError] = useState("");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [newPart, setNewPart] = useState({ name: "", make: "", model: "", year: "", price: "", quantity: "", sku: "", aliases: "", supplierId: "", image: null });
  const [apiError, setApiError] = useState("");

  const t = T[lang];

  // Load the full catalog + suppliers/orders/customers/requests from the backend on mount.
  useEffect(() => {
    async function loadAll() {
      try {
        const [partsRes, suppliersRes, ordersRes, customersRes, requestsRes, supplierReqRes, photoReqRes] = await Promise.all([
          fetch(`${API_BASE}/parts`),
          fetch(`${API_BASE}/suppliers`),
          fetch(`${API_BASE}/orders`),
          fetch(`${API_BASE}/customers`),
          fetch(`${API_BASE}/part-requests`),
          fetch(`${API_BASE}/supplier-requests`),
          fetch(`${API_BASE}/photo-requests`),
        ]);
        const responses = [partsRes, suppliersRes, ordersRes, customersRes, requestsRes, supplierReqRes, photoReqRes];
        if (responses.some((r) => !r.ok)) throw new Error("one or more endpoints returned an error");
        setParts(await partsRes.json());
        setSuppliers(await suppliersRes.json());
        setOrders(await ordersRes.json());
        setCustomers(await customersRes.json());
        setPartRequests(await requestsRes.json());
        setSupplierRequests(await supplierReqRes.json());
        setPhotoRequests(await photoReqRes.json());
        setApiError("");
      } catch (e) {
        setApiError(t.apiOffline);
      }
    }
    loadAll();
  }, []);

  // Default the "add part" supplier dropdown once suppliers arrive.
  useEffect(() => {
    if (suppliers.length && !newPart.supplierId) {
      setNewPart((p) => ({ ...p, supplierId: suppliers[0].id }));
    }
  }, [suppliers]);

  // Re-query the backend's search endpoint (server-side fuzzy matching) whenever the customer's search changes.
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams({ ...search, lang });
      fetch(`${API_BASE}/parts?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("search failed"))))
        .then((data) => setSearchResults(Array.isArray(data) ? data : []))
        .catch(() => setApiError(t.apiOffline));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, lang]);

  const hasActiveSearch = Object.values(search).some((v) => v.trim());

  function addToCart(part) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === part.id);
      if (existing) {
        return prev.map((i) => (i.id === part.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...part, qty: 1 }];
    });
  }

  function updateQty(id, delta) {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  }

  function removeFromCart(id) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  async function submitRegistration() {
    const { username, password, name, phone, email } = regForm;
    if (!username.trim() || !password.trim() || !name.trim() || !phone.trim() || !email.trim()) {
      setRegError(t.fillFields);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, name, phone, email }),
      });
      if (res.status === 409) {
        const errBody = await res.json().catch(() => ({}));
        setRegError(errBody.reason === "email" ? t.emailTaken : t.usernameTaken);
        return;
      }
      if (!res.ok) throw new Error("register failed");
      const user = await res.json();
      setCustomers((prev) => [...prev, user]);
      setCurrentUser(user);
      setRegError("");
      setScreen("home");
    } catch (e) {
      setRegError(t.apiOffline);
    }
  }

  async function submitLogin() {
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      setLoginError(t.loginFillFields);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/customers/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      if (res.status === 403) {
        setLoginError(t.emailNotVerified);
        return;
      }
      if (!res.ok) {
        setLoginError(t.loginError);
        return;
      }
      const user = await res.json();
      setCurrentUser(user);
      setLoginError("");
      setScreen("home");
    } catch (e) {
      setLoginError(t.apiOffline);
    }
  }

  async function resendVerification() {
    try {
      await fetch(`${API_BASE}/customers/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginForm.username }),
      });
      setLoginError(t.verificationResent);
    } catch (e) {
      setLoginError(t.apiOffline);
    }
  }

  async function placeOrder() {
    if (cart.length === 0) return;
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: currentUser ? currentUser.name : { ar: "زائر", en: "Guest" },
          items: cart,
          vin: vin || null,
          vinInfo: vinInfo || null,
        }),
      });
      const order = await res.json();
      setOrders((prev) => [order, ...prev]);
      setCart([]);
      setScreen("orders");
    } catch (e) {
      setApiError(t.apiOffline);
    }
  }

  async function advanceOrderStatus(orderId) {
    const current = orders.find((o) => o.id === orderId);
    if (!current) return;
    const nextStage = Math.min(current.stage + 1, T.ar.stages.length - 1);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: nextStage }),
      });
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (e) {
      setApiError(t.apiOffline);
    }
  }

  async function submitPartRequest(data) {
    try {
      const res = await fetch(`${API_BASE}/part-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const req = await res.json();
      setPartRequests((prev) => [req, ...prev]);
    } catch (e) {
      setApiError(t.apiOffline);
    }
  }

  async function submitPhotoRequest(data) {
    try {
      const res = await fetch(`${API_BASE}/photo-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: currentUser.id, customerName: currentUser.name, ...data }),
      });
      if (!res.ok) return false;
      const req = await res.json();
      setPhotoRequests((prev) => [req, ...prev]);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function sendPhotoRequestToSuppliers(requestId, supplierIds) {
    try {
      const res = await fetch(`${API_BASE}/photo-requests/${requestId}/send-to-suppliers`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierIds }),
      });
      const updated = await res.json();
      setPhotoRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
      return updated;
    } catch (e) {
      setApiError(t.apiOffline);
      return null;
    }
  }

  async function markRequestFulfilled(id) {
    try {
      const res = await fetch(`${API_BASE}/part-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfilled: true }),
      });
      const updated = await res.json();
      setPartRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (e) {
      setApiError(t.apiOffline);
    }
  }

  async function addSupplier() {
    if (!newSupplier.name.trim() || !newSupplier.phone.trim() || !newSupplier.email.trim() || !newSupplier.username.trim() || !newSupplier.password.trim()) {
      setSupplierError(t.fillShopFields);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/suppliers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSupplier.name, city: newSupplier.city || "-", phone: newSupplier.phone, email: newSupplier.email,
          username: newSupplier.username, password: newSupplier.password,
        }),
      });
      const supplier = await res.json();
      setSuppliers((prev) => [...prev, supplier]);
      setNewSupplier({ name: "", city: "", phone: "", email: "", username: "", password: "" });
      setSupplierError("");
    } catch (e) {
      setSupplierError(t.apiOffline);
    }
  }

  async function updateSupplier(id, data) {
    try {
      const res = await fetch(`${API_BASE}/suppliers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return false;
      const updated = await res.json();
      setSuppliers((prev) => prev.map((s) => (s.id === id ? updated : s)));
      return true;
    } catch (e) {
      return false;
    }
  }

  async function deleteSupplier(id) {
    try {
      const res = await fetch(`${API_BASE}/suppliers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setApiError(t.apiOffline);
        return false;
      }
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch (e) {
      setApiError(t.apiOffline);
      return false;
    }
  }

  async function submitSupplierRequest(type, payload) {
    try {
      const res = await fetch(`${API_BASE}/supplier-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId: currentSupplier.id, supplierName: L(currentSupplier.name, lang), type, payload }),
      });
      const request = await res.json();
      setSupplierRequests((prev) => [request, ...prev]);
      return true;
    } catch (e) {
      setApiError(t.apiOffline);
      return false;
    }
  }

  async function resubmitSupplierRequest(id, payload) {
    try {
      const res = await fetch(`${API_BASE}/supplier-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload, status: "pending", adminNote: "" }),
      });
      const updated = await res.json();
      setSupplierRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return true;
    } catch (e) {
      setApiError(t.apiOffline);
      return false;
    }
  }

  async function reviewSupplierRequest(id, status, adminNote) {
    try {
      const res = await fetch(`${API_BASE}/supplier-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: adminNote || "" }),
      });
      const updated = await res.json();
      setSupplierRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (status === "approved") {
        // Refresh parts/suppliers since an approval may have changed the catalog or a supplier's profile.
        const [partsRes, suppliersRes] = await Promise.all([fetch(`${API_BASE}/parts`), fetch(`${API_BASE}/suppliers`)]);
        setParts(await partsRes.json());
        setSuppliers(await suppliersRes.json());
      }
    } catch (e) {
      setApiError(t.apiOffline);
    }
  }

  async function addPart() {
    if (!newPart.name.trim() || !newPart.price) return;
    const aliasesArray = newPart.aliases.split(",").map((a) => a.trim()).filter(Boolean);
    try {
      const res = await fetch(`${API_BASE}/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newPart, aliases: aliasesArray, price: Number(newPart.price), quantity: Number(newPart.quantity) || 0 }),
      });
      const part = await res.json();
      setParts((prev) => [...prev, part]);
      setNewPart({ name: "", make: "", model: "", year: "", price: "", quantity: "", sku: "", aliases: "", supplierId: suppliers[0]?.id || "", image: null });
    } catch (e) {
      setApiError(t.apiOffline);
    }
  }

  async function updatePart(id, data) {
    try {
      const res = await fetch(`${API_BASE}/parts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        setApiError(t.apiOffline);
        return false;
      }
      const updated = await res.json();
      setParts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return true;
    } catch (e) {
      setApiError(t.apiOffline);
      return false;
    }
  }

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className={`min-h-screen bg-stone-100 text-slate-900 font-sans ${isDesktop ? "flex items-center justify-center p-6" : ""}`}
    >
      <div
        className={`w-full bg-white overflow-hidden flex ${
          isDesktop
            ? "flex-row max-w-5xl h-[640px] rounded-2xl shadow-xl border border-slate-200"
            : "flex-col min-h-screen max-w-md mx-auto"
        }`}
      >
        <div
          className={isDesktop ? "flex flex-col shrink-0" : ""}
          style={isDesktop ? { width: 240, borderInlineEnd: "1px solid #e2e8f0" } : undefined}
        >
          <TopBar
            t={t} lang={lang} setLang={setLang} currency={currency} setCurrency={setCurrency}
            role={role} setRole={setRole} setScreen={setScreen} cartCount={cartCount}
            isDesktop={isDesktop}
          />
          {role === "customer" && isDesktop && (
            <SidebarNav t={t} lang={lang} screen={screen} setScreen={setScreen} cartCount={cartCount} />
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className={`flex-1 overflow-y-auto ${isDesktop ? "" : "pb-20"}`}>
            {apiError && (
              <div className="bg-red-50 border-b border-red-200 text-red-700 text-xs px-4 py-2">
                {apiError}
              </div>
            )}
            {role === "customer" ? (
              <>
                {screen === "home" && (
                  <Home t={t} lang={lang} currentUser={currentUser} onSearch={() => setScreen("search")} onRegister={() => setScreen("login")} onLogout={() => setCurrentUser(null)} onSnapSend={() => setScreen("photoRequest")} />
                )}
                {screen === "login" && (
                  <Login t={t} loginForm={loginForm} setLoginForm={setLoginForm} error={loginError} onSubmit={submitLogin} onGoToRegister={() => setScreen("register")} onResend={resendVerification} />
                )}
                {screen === "checkEmail" && (
                  <CheckEmail t={t} email={registeredEmail} onBackToLogin={() => setScreen("login")} />
                )}
                {screen === "register" && (
                  <Register t={t} regForm={regForm} setRegForm={setRegForm} error={regError} onSubmit={submitRegistration} onGoToLogin={() => setScreen("login")} />
                )}
                {screen === "photoRequest" && (
                  <PhotoRequest t={t} onSubmit={submitPhotoRequest} onBack={() => setScreen("home")} onDone={() => setScreen("orders")} />
                )}
                {screen === "search" && (
                  <SearchScreen
                    t={t} lang={lang} currency={currency}
                    search={search} setSearch={setSearch}
                    parts={searchResults} hasActiveSearch={hasActiveSearch}
                    onSelect={(p) => { setSelectedPart(p); setScreen("detail"); }}
                    onSubmitRequest={submitPartRequest}
                    vin={vin} setVin={setVin} vinInfo={vinInfo} setVinInfo={setVinInfo}
                  />
                )}
                {screen === "detail" && selectedPart && (
                  <PartDetail t={t} lang={lang} currency={currency} part={selectedPart} onBack={() => setScreen("search")} onAdd={() => { addToCart(selectedPart); setScreen("cart"); }} />
                )}
                {screen === "cart" && (
                  <CartScreen
                    t={t} lang={lang} currency={currency}
                    cart={cart} total={cartTotal} onQty={updateQty} onRemove={removeFromCart}
                    onCheckout={placeOrder} onBrowse={() => setScreen("search")} currentUser={currentUser}
                    onNeedsRegister={() => setScreen("login")}
                    vin={vin} vinInfo={vinInfo}
                  />
                )}
                {screen === "orders" && (
                  <OrdersScreen
                    t={t} lang={lang} currency={currency} orders={orders}
                    photoRequests={currentUser ? photoRequests.filter((r) => r.customerId === currentUser.id) : []}
                  />
                )}
              </>
            ) : role === "supplier" ? (
              currentSupplier ? (
                <SupplierDashboard
                  t={t} lang={lang} currency={currency} screen={screen} setScreen={setScreen}
                  supplier={currentSupplier} parts={parts}
                  requests={supplierRequests.filter((r) => r.supplierId === currentSupplier.id)}
                  onSubmitRequest={submitSupplierRequest}
                  onResubmit={resubmitSupplierRequest}
                />
              ) : (
                <SupplierLogin t={t} onSuccess={(supplier) => { setCurrentSupplier(supplier); setScreen("myProfile"); }} />
              )
            ) : adminAuthenticated ? (
              <AdminDashboard
                t={t} lang={lang} currency={currency}
                screen={screen} setScreen={setScreen}
                customers={customers} suppliers={suppliers} parts={parts}
                orders={orders} onAdvance={advanceOrderStatus}
                newPart={newPart} setNewPart={setNewPart} onAddPart={addPart} onUpdatePart={updatePart}
                newSupplier={newSupplier} setNewSupplier={setNewSupplier}
                onAddSupplier={addSupplier} supplierError={supplierError} onUpdateSupplier={updateSupplier} onDeleteSupplier={deleteSupplier}
                partRequests={partRequests} onMarkFulfilled={markRequestFulfilled}
                supplierRequests={supplierRequests} onReviewSupplierRequest={reviewSupplierRequest}
                photoRequests={photoRequests} onSendToSuppliers={sendPhotoRequestToSuppliers}
              />
            ) : (
              <AdminLogin t={t} onSuccess={() => { setAdminAuthenticated(true); setScreen("overview"); }} />
            )}
          </div>

          {role === "customer" && !isDesktop && (
            <BottomNav t={t} screen={screen} setScreen={setScreen} cartCount={cartCount} />
          )}
        </div>
      </div>
    </div>
  );
}

function TopBar({ t, lang, setLang, currency, setCurrency, role, setRole, setScreen, cartCount, isDesktop }) {
  return (
    <div className="border-b border-slate-200 bg-slate-900 text-white">
      <div className={`px-4 py-3 flex ${isDesktop ? "flex-col items-stretch gap-3" : "items-center justify-between"}`}>
        <div className={`flex items-center gap-2 ${isDesktop ? "justify-center" : ""}`}>
          <Package size={20} />
          <span className="text-base font-medium">{t.appName}</span>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-slate-600 w-full">
          <button
            onClick={() => { setRole("customer"); setScreen("home"); }}
            className={`flex-1 px-2 py-1.5 text-xs sm:text-sm text-center ${role === "customer" ? "bg-amber-500 text-slate-900" : "text-slate-300"}`}
          >
            {t.customerTab}
          </button>
          <button
            onClick={() => { setRole("supplier"); setScreen("myProfile"); }}
            className={`flex-1 px-2 py-1.5 text-xs sm:text-sm text-center ${role === "supplier" ? "bg-amber-500 text-slate-900" : "text-slate-300"}`}
          >
            {t.supplierTab}
          </button>
          <button
            onClick={() => { setRole("admin"); setScreen("overview"); }}
            className={`flex-1 px-2 py-1.5 text-xs sm:text-sm text-center ${role === "admin" ? "bg-amber-500 text-slate-900" : "text-slate-300"}`}
          >
            {t.adminTab}
          </button>
        </div>
      </div>
      <div className={`px-4 pb-3 flex text-xs text-slate-300 ${isDesktop ? "flex-col items-stretch gap-2 pb-4" : "items-center gap-4"}`}>
        <div className={`flex items-center gap-1.5 ${isDesktop ? "justify-center" : ""}`}>
          <Globe size={13} />
          <button onClick={() => setLang("ar")} className={lang === "ar" ? "text-amber-400" : ""}>عربي</button>
          <span>/</span>
          <button onClick={() => setLang("en")} className={lang === "en" ? "text-amber-400" : ""}>EN</button>
        </div>
        <div className={`flex items-center gap-1.5 ${isDesktop ? "justify-center" : ""}`}>
          <Coins size={13} />
          <button onClick={() => setCurrency("SAR")} className={currency === "SAR" ? "text-amber-400" : ""}>SAR</button>
          <span>/</span>
          <button onClick={() => setCurrency("BHD")} className={currency === "BHD" ? "text-amber-400" : ""}>BHD</button>
        </div>
      </div>
    </div>
  );
}

function BottomNav({ t, screen, setScreen, cartCount }) {
  const items = [
    { key: "home", label: t.navHome, icon: Store },
    { key: "search", label: t.navSearch, icon: Search },
    { key: "cart", label: t.navCart, icon: ShoppingCart, badge: cartCount },
    { key: "orders", label: t.navOrders, icon: ClipboardList },
  ];
  return (
    <div className="border-t border-slate-200 bg-white flex">
      {items.map(({ key, label, icon: Icon, badge }) => (
        <button
          key={key}
          onClick={() => setScreen(key)}
          className={`flex-1 flex flex-col items-center gap-1 py-2.5 relative ${screen === key ? "text-amber-600" : "text-slate-400"}`}
        >
          <Icon size={20} />
          {!!badge && (
            <span className="absolute top-1 right-8 bg-amber-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {badge}
            </span>
          )}
          <span className="text-xs">{label}</span>
        </button>
      ))}
    </div>
  );
}

function SidebarNav({ t, lang, screen, setScreen, cartCount }) {
  const items = [
    { key: "home", label: t.navHome, icon: Store },
    { key: "search", label: t.navSearch, icon: Search },
    { key: "cart", label: t.navCart, icon: ShoppingCart, badge: cartCount },
    { key: "orders", label: t.navOrders, icon: ClipboardList },
  ];
  return (
    <div className="flex flex-col flex-1 py-3 gap-1">
      {items.map(({ key, label, icon: Icon, badge }) => (
        <button
          key={key}
          onClick={() => setScreen(key)}
          style={
            screen === key
              ? { borderInlineStart: "2px solid #f59e0b" }
              : { borderInlineStart: "2px solid transparent" }
          }
          className={`flex items-center gap-3 px-5 py-2.5 text-sm ${screen === key ? "bg-amber-50 text-amber-700" : "text-slate-500"}`}
        >
          <Icon size={17} />
          <span>{label}</span>
          {!!badge && (
            <span className="ms-auto bg-amber-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center" style={{ marginInlineStart: "auto" }}>
              {badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function Home({ t, lang, currentUser, onSearch, onRegister, onLogout, onSnapSend }) {
  return (
    <div className="p-5 space-y-5">
      <div className="bg-slate-900 rounded-xl p-5 text-white">
        <h1 className="text-lg font-medium mb-1">
          {currentUser ? t.welcome(currentUser.name.split(" ")[0]) : t.heroTitle}
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">{t.heroSubtitle}</p>
        <button onClick={onSearch} className="mt-4 bg-amber-500 text-slate-900 text-sm px-4 py-2 rounded-lg flex items-center gap-2">
          <Search size={16} /> {t.startSearch}
        </button>
      </div>

      <button
        onClick={() => (currentUser ? onSnapSend() : onRegister())}
        className="w-full bg-amber-500 rounded-xl p-4 flex items-center gap-4 text-start"
      >
        <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
          <Camera size={22} className="text-amber-500" />
        </div>
        <div className="flex-1">
          <div className="text-slate-900 font-medium text-base">{t.snapSendTitle}</div>
          <div className="text-slate-800 text-xs mt-0.5">{t.snapSendDesc}</div>
        </div>
        <ChevronLeft size={18} className="text-slate-900 rtl:block ltr:rotate-180" />
      </button>

      {!currentUser ? (
        <button onClick={onRegister} className="w-full border border-slate-300 rounded-xl p-4 flex items-center justify-between text-sm">
          <span>{t.registerBanner}</span>
          <ChevronLeft size={18} className="text-slate-400" />
        </button>
      ) : (
        <button onClick={onLogout} className="w-full text-center text-xs text-slate-400">
          {t.logoutBtn}
        </button>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-medium text-slate-900">+120</div>
          <div className="text-xs text-slate-500 mt-1">{t.statSuppliers}</div>
        </div>
        <div className="border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-medium text-slate-900">{t.statHidden}</div>
          <div className="text-xs text-slate-500 mt-1">{t.statHiddenSub}</div>
        </div>
      </div>
    </div>
  );
}

function Login({ t, loginForm, setLoginForm, error, onSubmit, onGoToRegister, onResend }) {
  return (
    <div className="p-5 space-y-4">
      <h2 className="text-base font-medium">{t.loginTitle}</h2>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-500 block mb-1">{t.username}</label>
          <input
            value={loginForm.username}
            onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">{t.password}</label>
          <input
            type="password"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        {error && (
          <div>
            <p className="text-xs text-red-600">{error}</p>
            {error === t.emailNotVerified && (
              <button onClick={onResend} className="text-xs text-amber-600 mt-1">{t.resendVerification}</button>
            )}
          </div>
        )}
        <button onClick={onSubmit} className="w-full bg-amber-500 text-slate-900 text-sm py-2.5 rounded-lg font-medium">
          {t.loginBtn}
        </button>
        <button onClick={onGoToRegister} className="w-full text-center text-xs text-slate-500 pt-1">
          {t.noAccountYet} <span className="text-amber-600">{t.createAccountLink}</span>
        </button>
      </div>
    </div>
  );
}

function CheckEmail({ t, email, onBackToLogin }) {
  return (
    <div className="p-6 max-w-xs mx-auto text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
        <Bell size={24} className="text-amber-600" />
      </div>
      <h2 className="text-base font-medium">{t.checkEmailTitle}</h2>
      <p className="text-sm text-slate-500">{t.checkEmailBody(email)}</p>
      <button onClick={onBackToLogin} className="w-full bg-slate-900 text-white text-sm py-2.5 rounded-lg font-medium">
        {t.loginLink}
      </button>
    </div>
  );
}

function Register({ t, regForm, setRegForm, error, onSubmit, onGoToLogin }) {
  return (
    <div className="p-5 space-y-4">
      <h2 className="text-base font-medium">{t.registerTitle}</h2>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-500 block mb-1">{t.username}</label>
          <input
            value={regForm.username}
            onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">{t.password}</label>
          <input
            type="password"
            value={regForm.password}
            onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">{t.fullName}</label>
          <input
            value={regForm.name}
            onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder={t.namePh}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">{t.phone}</label>
          <input
            value={regForm.phone}
            onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder={t.phonePh}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">{t.emailLabel}</label>
          <input
            type="email"
            value={regForm.email}
            onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button onClick={onSubmit} className="w-full bg-amber-500 text-slate-900 text-sm py-2.5 rounded-lg font-medium">
          {t.createAccount}
        </button>
        <button onClick={onGoToLogin} className="w-full text-center text-xs text-slate-500 pt-1">
          {t.haveAccountAlready} <span className="text-amber-600">{t.loginLink}</span>
        </button>
      </div>
    </div>
  );
}

function SearchScreen({ t, lang, currency, search, setSearch, parts, hasActiveSearch, onSelect, onSubmitRequest, vin, setVin, vinInfo, setVinInfo }) {
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [heardText, setHeardText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState("");
  const [reqForm, setReqForm] = useState({ partName: "", carType: "", year: "", name: "", phone: "", email: "" });
  const [reqError, setReqError] = useState("");
  const [reqSubmitted, setReqSubmitted] = useState(false);

  function updateField(field, value) {
    setSearch((prev) => ({ ...prev, [field]: value }));
    setReqSubmitted(false);
  }

  function updateReqField(field, value) {
    setReqForm((prev) => ({ ...prev, [field]: value }));
  }

  function submitRequest() {
    const partNameDefault = reqForm.partName || search.partName;
    const carTypeDefault = reqForm.carType || `${search.carMake} ${search.carModel}`.trim();
    const yearDefault = reqForm.year || search.year;
    const { name, phone, email } = reqForm;
    if (!partNameDefault.trim() || !carTypeDefault.trim() || !yearDefault.trim() || !name.trim() || !phone.trim() || !email.trim()) {
      setReqError(t.requestFillFields);
      return;
    }
    onSubmitRequest({ partName: partNameDefault, carType: carTypeDefault, year: yearDefault, name, phone, email });
    setReqError("");
    setReqSubmitted(true);
  }

  async function analyzeVoiceQuery(transcript) {
    setAiLoading(true);
    setVoiceError("");
    try {
      const response = await fetch(`${API_BASE}/ai/parse-voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!response.ok) throw new Error("ai parse failed");
      const parsed = await response.json();
      setSearch((prev) => ({
        partName: parsed.partName || prev.partName,
        carMake: parsed.carMake || prev.carMake,
        carModel: parsed.carModel || prev.carModel,
        year: parsed.year || prev.year,
        partNumber: parsed.partNumber || prev.partNumber,
      }));
    } catch (err) {
      setVoiceError(t.aiError);
    } finally {
      setAiLoading(false);
    }
  }

  function startVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError(t.micUnsupported);
      return;
    }
    setVoiceError("");
    setHeardText("");
    const recognition = new SpeechRecognition();
    recognition.lang = lang === "ar" ? "ar-SA" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setVoiceError(t.micPermissionDenied);
      } else if (event.error === "no-speech") {
        setVoiceError(t.micNoSpeech);
      } else {
        setVoiceError(t.micGenericError);
      }
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setHeardText(transcript);
      analyzeVoiceQuery(transcript);
    };
    recognition.start();
  }

  async function analyzeImageQuery(file) {
    setImageError("");
    setImageLoading(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const [, base64] = dataUrl.split(",");
      const response = await fetch(`${API_BASE}/ai/identify-part`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType: file.type || "image/jpeg" }),
      });
      if (!response.ok) throw new Error("ai identify failed");
      const parsed = await response.json();
      setSearch((prev) => ({
        partName: parsed.partName || prev.partName,
        carMake: parsed.carMake || prev.carMake,
        carModel: parsed.carModel || prev.carModel,
        year: parsed.year || prev.year,
        partNumber: parsed.partNumber || prev.partNumber,
      }));
    } catch (err) {
      setImageError(t.aiImageError);
    } finally {
      setImageLoading(false);
    }
  }

  function handleImageCapture(e) {
    const file = e.target.files && e.target.files[0];
    if (file) analyzeImageQuery(file);
    e.target.value = "";
  }

  async function decodeVinNumber() {
    if (!vin.trim()) return;
    setVinLoading(true);
    setVinError("");
    setVinInfo(null);
    try {
      const response = await fetch(`${API_BASE}/decode-vin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin: vin.trim() }),
      });
      if (!response.ok) throw new Error("vin decode failed");
      const info = await response.json();
      setVinInfo(info);
      setSearch((prev) => ({
        ...prev,
        carMake: info.make || prev.carMake,
        carModel: info.model || prev.carModel,
        year: info.year || prev.year,
      }));
    } catch (err) {
      setVinError(t.vinError);
    } finally {
      setVinLoading(false);
    }
  }

  const fields = [
    { key: "partName", label: t.searchPartName },
    { key: "carMake", label: t.searchCarMake },
    { key: "carModel", label: t.searchCarModel },
    { key: "year", label: t.searchYear },
    { key: "partNumber", label: t.searchPartNumber },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="border border-slate-200 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">{t.voiceSearchAll}</span>
          <div className="flex items-center gap-2 shrink-0">
            <label
              title={t.cameraSearch}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 cursor-pointer"
            >
              <Camera size={16} />
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
            </label>
            <button
              onClick={startVoiceSearch}
              title={t.voiceSearchAll}
              className={`w-9 h-9 rounded-full flex items-center justify-center ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-amber-500 text-slate-900"}`}
            >
              <Mic size={16} />
            </button>
          </div>
        </div>
        {isListening && <p className="text-xs text-amber-600">{t.listening}</p>}
        {!isListening && aiLoading && <p className="text-xs text-amber-600">{t.aiAnalyzing}</p>}
        {imageLoading && <p className="text-xs text-amber-600">{t.aiAnalyzingImage}</p>}
        {!isListening && !aiLoading && heardText && <p className="text-xs text-slate-400">{t.heardPrefix(heardText)}</p>}
        {voiceError && <p className="text-xs text-red-500">{voiceError}</p>}
        {imageError && <p className="text-xs text-red-500">{imageError}</p>}

        <div className="pt-1 border-t border-slate-100">
          <label className="text-xs text-slate-500 block mb-1">{t.vinLabel}</label>
          <div className="flex gap-2">
            <input
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              placeholder={t.vinPlaceholder}
              maxLength={17}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm tracking-wide"
            />
            <button
              onClick={decodeVinNumber}
              disabled={vinLoading}
              className="bg-slate-900 text-white text-xs px-4 rounded-lg shrink-0 disabled:opacity-50"
            >
              {t.vinDecodeBtn}
            </button>
          </div>
          {vinLoading && <p className="text-xs text-amber-600 mt-1">{t.vinDecoding}</p>}
          {vinError && <p className="text-xs text-red-500 mt-1">{vinError}</p>}
          {vinInfo && !vinLoading && (
            <div className="mt-1">
              <p className="text-xs text-emerald-700">
                {vinInfo.make} {vinInfo.model} {vinInfo.year}{vinInfo.trim ? ` · ${vinInfo.trim}` : ""}{vinInfo.engine ? ` · ${vinInfo.engine}` : ""}
              </p>
              {vinInfo.approximate && <p className="text-xs text-amber-600 mt-0.5">{t.vinApproximate}</p>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {fields.map(({ key, label }) => (
            <div key={key} className={key === "partNumber" || key === "partName" ? "col-span-2" : ""}>
              <label className="text-xs text-slate-500 block mb-1">{label}</label>
              <input
                value={search[key]}
                onChange={(e) => updateField(key, e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {hasActiveSearch && parts.length === 0 && (
          <div className="space-y-4">
            <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 text-sm text-amber-800">
              {t.noPartsNotice}
            </div>

            {reqSubmitted ? (
              <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4 text-sm text-emerald-700">
                {t.requestSuccessMsg}
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-medium mb-1">{t.requestPartTitle}</h3>
                <input
                  placeholder={t.requestPartName}
                  value={reqForm.partName || search.partName}
                  onChange={(e) => updateReqField("partName", e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder={t.requestCarType}
                    value={reqForm.carType || `${search.carMake} ${search.carModel}`.trim()}
                    onChange={(e) => updateReqField("carType", e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    placeholder={t.requestYear}
                    value={reqForm.year || search.year}
                    onChange={(e) => updateReqField("year", e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <input placeholder={t.requestCustomerName} value={reqForm.name} onChange={(e) => updateReqField("name", e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder={t.requestPhone} value={reqForm.phone} onChange={(e) => updateReqField("phone", e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                  <input placeholder={t.requestEmail} type="email" value={reqForm.email} onChange={(e) => updateReqField("email", e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                {reqError && <p className="text-xs text-red-600">{reqError}</p>}
                <button onClick={submitRequest} className="w-full bg-amber-500 text-slate-900 text-sm py-2 rounded-lg font-medium mt-1">
                  {t.submitRequest}
                </button>
              </div>
            )}
          </div>
        )}
        {parts.map((p) => (
          <button key={p.id} onClick={() => onSelect(p)} className="w-full flex items-center gap-3 border border-slate-200 rounded-xl p-3 text-start">
            <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
              {p.image ? <img src={p.image} alt={L(p.name, lang)} className="w-full h-full object-cover" /> : <Package size={22} className="text-slate-400" />}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{L(p.name, lang)}</div>
              <div className="text-xs text-slate-500 mt-0.5">{L(p.make, lang)} {L(p.model, lang)} · {p.year} · {p.sku}</div>
              <div className="text-sm text-amber-600 font-medium mt-1">{formatPrice(p.price, currency, lang)}</div>
            </div>
            <ChevronLeft size={18} className="text-slate-300 rtl:block ltr:rotate-180" />
          </button>
        ))}
      </div>
    </div>
  );
}

function PhotoRequest({ t, onSubmit, onBack, onDone }) {
  const [photo, setPhoto] = useState(null);
  const [form, setForm] = useState({ carMake: "", carType: "", year: "", cylinders: "", engineSize: "", quantity: "1" });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function handleCapture(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleSubmit() {
    if (!photo || !form.carMake.trim() || !form.carType.trim() || !form.year.trim() || !form.quantity.trim()) {
      setError(t.requestFillFields);
      return;
    }
    setSending(true);
    const ok = await onSubmit({ image: photo, ...form });
    setSending(false);
    if (ok) setSent(true);
    else setError(t.apiOffline);
  }

  if (sent) {
    return (
      <div className="p-6 max-w-xs mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
          <Check size={24} className="text-emerald-600" />
        </div>
        <h2 className="text-base font-medium">{t.photoRequestSentTitle}</h2>
        <p className="text-sm text-slate-500">{t.photoRequestSentBody}</p>
        <button onClick={onDone} className="w-full bg-slate-900 text-white text-sm py-2.5 rounded-lg font-medium">{t.navOrders}</button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <button onClick={onBack} className="text-sm text-slate-500 flex items-center gap-1">
        <ChevronRight size={16} className="ltr:rotate-180" /> {t.back}
      </button>
      <h2 className="text-base font-medium">{t.snapSendTitle}</h2>

      {photo ? (
        <div className="relative">
          <img src={photo} alt="" className="w-full h-48 object-cover rounded-xl border border-slate-200" />
          <label className="absolute bottom-2 left-2 bg-white/90 text-xs px-3 py-1.5 rounded-lg cursor-pointer">
            {t.changeImage}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapture} />
          </label>
        </div>
      ) : (
        <label className="w-full h-40 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 cursor-pointer">
          <Camera size={28} />
          <span className="text-xs">{t.uploadFromDevice}</span>
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapture} />
        </label>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-500 block mb-1">{t.carMakeField}</label>
          <input value={form.carMake} onChange={(e) => setForm({ ...form, carMake: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">{t.carTypeField}</label>
          <input value={form.carType} onChange={(e) => setForm({ ...form, carType: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-500 block mb-1">{t.years}</label>
          <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">{t.quantityField}</label>
          <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-500 block mb-1">{t.cylindersLabel} <span className="text-slate-300">({t.optionalField})</span></label>
          <input value={form.cylinders} onChange={(e) => setForm({ ...form, cylinders: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">{t.engineSizeLabel} <span className="text-slate-300">({t.optionalField})</span></label>
          <input value={form.engineSize} onChange={(e) => setForm({ ...form, engineSize: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      <button onClick={handleSubmit} disabled={sending} className="w-full bg-amber-500 text-slate-900 text-sm py-2.5 rounded-lg font-medium disabled:opacity-50">
        {sending ? t.sendingLabel : t.submitRequest}
      </button>
    </div>
  );
}

function PartDetail({ t, lang, currency, part, onBack, onAdd }) {
  return (
    <div className="p-4 space-y-4">
      <button onClick={onBack} className="text-sm text-slate-500 flex items-center gap-1">
        <ChevronRight size={16} className="ltr:rotate-180" /> {t.back}
      </button>
      <div className="w-full h-40 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
        {part.image ? <img src={part.image} alt={L(part.name, lang)} className="w-full h-full object-cover" /> : <Package size={40} className="text-slate-300" />}
      </div>
      <div>
        <h2 className="text-lg font-medium">{L(part.name, lang)}</h2>
        <p className="text-sm text-slate-500 mt-1">{t.compatibleWith(L(part.make, lang), L(part.model, lang), part.year)}</p>
      </div>
      <div className="border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">{t.condition}</span><span>{L(part.condition, lang)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">{t.availability}</span><span className="text-emerald-600">{t.availableNow}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">{t.deliveryEst}</span><span>{t.deliveryDays}</span></div>
      </div>
      <div className="flex items-center justify-between pt-2">
        <span className="text-xl font-medium">{formatPrice(part.price, currency, lang)}</span>
        <button onClick={onAdd} className="bg-amber-500 text-slate-900 text-sm px-5 py-2.5 rounded-lg font-medium flex items-center gap-2">
          <ShoppingCart size={16} /> {t.addToCart}
        </button>
      </div>
    </div>
  );
}

function CartScreen({ t, lang, currency, cart, total, onQty, onRemove, onCheckout, onBrowse, currentUser, onNeedsRegister, vin, vinInfo }) {
  if (cart.length === 0) {
    return (
      <div className="p-8 text-center space-y-3">
        <ShoppingCart size={32} className="mx-auto text-slate-300" />
        <p className="text-sm text-slate-400">{t.emptyCart}</p>
        <button onClick={onBrowse} className="text-sm text-amber-600">{t.browseParts}</button>
      </div>
    );
  }
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-3">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center gap-3 border border-slate-200 rounded-xl p-3">
            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
              {item.image ? <img src={item.image} alt={L(item.name, lang)} className="w-full h-full object-cover" /> : <Package size={18} className="text-slate-400" />}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{L(item.name, lang)}</div>
              <div className="text-xs text-amber-600 mt-0.5">{formatPrice(item.price, currency, lang)}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onQty(item.id, -1)} className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center"><Minus size={12} /></button>
              <span className="text-sm w-4 text-center">{item.qty}</span>
              <button onClick={() => onQty(item.id, 1)} className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center"><Plus size={12} /></button>
            </div>
            <button onClick={() => onRemove(item.id)} className="text-slate-300"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
      {vin && (
        <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-3 text-xs text-emerald-700">
          {t.vinAttached}: {vin}{vinInfo ? ` · ${vinInfo.make} ${vinInfo.model} ${vinInfo.year}` : ""}
        </div>
      )}
      <div className="border-t border-slate-200 pt-3 flex justify-between text-sm">
        <span className="text-slate-500">{t.total}</span>
        <span className="font-medium text-base">{formatPrice(total, currency, lang)}</span>
      </div>
      <button
        onClick={currentUser ? onCheckout : onNeedsRegister}
        className="w-full bg-slate-900 text-white text-sm py-2.5 rounded-lg font-medium"
      >
        {currentUser ? t.confirmOrder : t.loginToOrder}
      </button>
      <p className="text-xs text-slate-400 text-center">{t.paymentNote}</p>
    </div>
  );
}

function OrdersScreen({ t, lang, currency, orders, photoRequests }) {
  if (orders.length === 0 && (!photoRequests || photoRequests.length === 0)) {
    return <p className="text-sm text-slate-400 text-center py-10">{t.noOrders}</p>;
  }
  return (
    <div className="p-4 space-y-4">
      {photoRequests && photoRequests.map((r) => (
        <div key={r.id} className="border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium flex items-center gap-1.5"><Camera size={14} className="text-amber-600" /> {t.snapSendTitle}</span>
            <span className="text-xs text-slate-400">{r.date}</span>
          </div>
          <div className="text-xs text-slate-500">{[r.carMake, r.carType, r.year].filter(Boolean).join(" · ")}</div>
          <span className={`text-xs px-2 py-1 rounded-full inline-block ${r.status === "sent_to_suppliers" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
            {r.status === "sent_to_suppliers" ? t.photoReqSentToSuppliers : t.photoReqPending}
          </span>
        </div>
      ))}
      {orders.map((o) => (
        <div key={o.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{o.id}</span>
            <span className="text-xs text-slate-400">{o.date}</span>
          </div>
          <StatusTracker t={t} stage={o.stage} />
          <div className="text-sm text-slate-500">{t.partsCount(o.items.length)} · {formatPrice(o.total, currency, lang)}</div>
        </div>
      ))}
    </div>
  );
}

function StatusTracker({ t, stage }) {
  return (
    <div className="flex items-center">
      {t.stages.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 ${i <= stage ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
            {i <= stage ? <Check size={12} /> : i + 1}
          </div>
          {i < t.stages.length - 1 && (
            <div className={`flex-1 h-0.5 ${i < stage ? "bg-emerald-500" : "bg-slate-100"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function SupplierLogin({ t, onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!username.trim() || !password.trim()) {
      setError(t.loginFillFields);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/suppliers/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError(t.loginError);
        return;
      }
      const supplier = await res.json();
      onSuccess(supplier);
    } catch (e) {
      setError(t.apiOffline);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xs mx-auto space-y-4">
      <h2 className="text-base font-medium text-center">{t.supplierLoginTitle}</h2>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-500 block mb-1">{t.username}</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">{t.password}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button onClick={handleSubmit} disabled={loading} className="w-full bg-slate-900 text-white text-sm py-2.5 rounded-lg font-medium disabled:opacity-50">
          {t.loginBtn}
        </button>
      </div>
    </div>
  );
}

function requestTypeLabel(t, type) {
  if (type === "profile_update") return t.requestTypeProfile;
  if (type === "update_part") return t.requestTypeUpdatePart;
  return t.requestTypeNewPart;
}

function RequestStatusBadge({ t, status }) {
  const map = {
    pending: { label: t.reqPending, cls: "bg-slate-100 text-slate-600" },
    approved: { label: t.reqApproved, cls: "bg-emerald-100 text-emerald-700" },
    rejected: { label: t.reqRejected, cls: "bg-red-100 text-red-600" },
    returned: { label: t.reqReturned, cls: "bg-amber-100 text-amber-700" },
  };
  const s = map[status] || map.pending;
  return <span className={`text-xs px-2 py-1 rounded-full ${s.cls}`}>{s.label}</span>;
}

function SupplierDashboard({ t, lang, currency, screen, setScreen, supplier, requests, parts, onSubmitRequest, onResubmit }) {
  const tabs = [
    { key: "myProfile", label: t.myProfileTab },
    { key: "myProducts", label: t.myProductsTab },
    { key: "addPart", label: t.addPartTab },
    { key: "myRequests", label: t.myRequestsTab },
  ];
  const activeTab = ["myProfile", "myProducts", "addPart", "myRequests"].includes(screen) ? screen : "myProfile";
  const myParts = (parts || []).filter((p) => p.supplierId === supplier.id);
  const [editingPart, setEditingPart] = useState(null);
  const [editPartForm, setEditPartForm] = useState(null);
  const [productSent, setProductSent] = useState(null);

  function startEditPart(p) {
    setEditingPart(p);
    setEditPartForm({ quantity: p.quantity !== undefined ? String(p.quantity) : "", price: String(p.price || ""), image: p.image || null });
    setProductSent(null);
  }

  async function submitPartEdit() {
    const ok = await onSubmitRequest("update_part", { partId: editingPart.id, ...editPartForm });
    if (ok) {
      setEditingPart(null);
      setProductSent(editingPart.id);
    }
  }

  const [profileForm, setProfileForm] = useState({ name: L(supplier.name, lang), city: L(supplier.city, lang), phone: supplier.phone });
  const [profileSent, setProfileSent] = useState(false);

  const [partForm, setPartForm] = useState({
    partName: "", partNumber: "", manufacturer: "", carType: "", carMake: "", year: "", cylinders: "", engineSize: "", price: "", quantity: "", image: null,
  });
  const [partError, setPartError] = useState("");
  const [partSent, setPartSent] = useState(false);

  const [editingRequest, setEditingRequest] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  async function submitProfile() {
    const ok = await onSubmitRequest("profile_update", profileForm);
    if (ok) setProfileSent(true);
  }

  async function submitPart() {
    const required = ["partName", "partNumber", "manufacturer", "carType", "carMake", "year", "cylinders", "engineSize"];
    if (required.some((f) => !String(partForm[f]).trim())) {
      setPartError(t.requestFillFields);
      return;
    }
    const ok = await onSubmitRequest("new_part", partForm);
    if (ok) {
      setPartSent(true);
      setPartError("");
      setPartForm({ partName: "", partNumber: "", manufacturer: "", carType: "", carMake: "", year: "", cylinders: "", engineSize: "", price: "", quantity: "", image: null });
    }
  }

  function startEdit(request) {
    setEditingRequest(request.id);
    setEditForm(request.payload);
  }

  async function submitEdit() {
    const ok = await onResubmit(editingRequest, editForm);
    if (ok) setEditingRequest(null);
  }

  const partFieldDefs = [
    { key: "partName", label: t.searchPartName },
    { key: "partNumber", label: t.searchPartNumber },
    { key: "manufacturer", label: t.manufacturerLabel },
    { key: "carType", label: t.carTypeField },
    { key: "carMake", label: t.carMakeField },
    { key: "year", label: t.years },
    { key: "cylinders", label: t.cylindersLabel },
    { key: "engineSize", label: t.engineSizeLabel },
  ];

  return (
    <div>
      <div className="flex overflow-x-auto border-b border-slate-200">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setScreen(key)}
            className={`px-4 py-3 text-xs whitespace-nowrap border-b-2 ${activeTab === key ? "border-amber-500 text-slate-900" : "border-transparent text-slate-400"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === "myProfile" && (
          <div className="space-y-3">
            {profileSent && (
              <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-3 text-xs text-emerald-700">{t.requestSentNote}</div>
            )}
            <input placeholder={t.shopName} value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder={t.city} value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder={t.contactNumber} value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <button onClick={submitProfile} className="w-full bg-slate-900 text-white text-sm py-2.5 rounded-lg font-medium">{t.requestProfileUpdate}</button>
          </div>
        )}

        {activeTab === "myProducts" && (
          <div className="space-y-2">
            {myParts.length === 0 && <p className="text-sm text-slate-400 text-center py-8">{t.noMyProducts}</p>}
            {myParts.map((p) => (
              <div key={p.id} className="border border-slate-200 rounded-xl p-3 space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {p.image ? <img src={p.image} alt={L(p.name, lang)} className="w-full h-full object-cover" /> : <Package size={16} className="text-slate-300" />}
                  </div>
                  <div className="flex-1">
                    <div>{L(p.name, lang)}</div>
                    <div className="text-xs text-slate-400">{formatPrice(p.price, currency, lang)} · {t.quantityField}: {p.quantity ?? 0}</div>
                  </div>
                  <button onClick={() => startEditPart(p)} className="text-xs text-amber-600">{t.editBtn}</button>
                </div>

                {productSent === p.id && (
                  <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-2 text-xs text-emerald-700">{t.requestSentNote}</div>
                )}

                {editingPart && editingPart.id === p.id && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">{t.quantityField}</label>
                      <input type="number" min="0" value={editPartForm.quantity} onChange={(e) => setEditPartForm({ ...editPartForm, quantity: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">{t.price}</label>
                      <input type="number" value={editPartForm.price} onChange={(e) => setEditPartForm({ ...editPartForm, price: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">{t.uploadImage} <span className="text-slate-300">({t.optionalField})</span></label>
                      <label className="w-full text-center block border border-dashed border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-500 cursor-pointer">
                        {editPartForm.image ? t.changeImage : t.uploadFromDevice}
                        <input
                          type="file" accept="image/*" className="hidden"
                          onChange={(e) => {
                            const file = e.target.files && e.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => setEditPartForm((f) => ({ ...f, image: reader.result }));
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                    <button onClick={submitPartEdit} className="w-full bg-slate-900 text-white text-xs py-2 rounded-lg">{t.submitRequest}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "addPart" && (
          <div className="space-y-2">
            {partSent && (
              <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-3 text-xs text-emerald-700 mb-1">{t.requestSentNote}</div>
            )}
            {partFieldDefs.map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-slate-500 block mb-1">{label}</label>
                <input
                  value={partForm[key]}
                  onChange={(e) => setPartForm({ ...partForm, [key]: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-500 block mb-1">{t.price}</label>
              <input type="number" value={partForm.price} onChange={(e) => setPartForm({ ...partForm, price: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">{t.quantityField}</label>
              <input type="number" min="0" value={partForm.quantity} onChange={(e) => setPartForm({ ...partForm, quantity: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">{t.uploadImage} <span className="text-slate-300">({t.optionalField})</span></label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                  {partForm.image ? <img src={partForm.image} alt="" className="w-full h-full object-cover" /> : <Package size={18} className="text-slate-300" />}
                </div>
                <label className="flex-1 text-center border border-dashed border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-500 cursor-pointer">
                  {partForm.image ? t.changeImage : t.uploadFromDevice}
                  <input
                    type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const file = e.target.files && e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setPartForm((p) => ({ ...p, image: reader.result }));
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>
            </div>
            {partError && <p className="text-xs text-red-600">{partError}</p>}
            <button onClick={submitPart} className="w-full bg-amber-500 text-slate-900 text-sm py-2.5 rounded-lg font-medium mt-1">{t.submitRequest}</button>
          </div>
        )}

        {activeTab === "myRequests" && (
          <div className="space-y-3">
            {requests.length === 0 && <p className="text-sm text-slate-400 text-center py-8">{t.myRequestsEmpty}</p>}
            {requests.map((r) => (
              <div key={r.id} className="border border-slate-200 rounded-xl p-3 space-y-2 text-sm">
                <button
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  className="w-full flex justify-between items-center text-start"
                >
                  <span className="text-xs font-medium">{requestTypeLabel(t, r.type)}</span>
                  <RequestStatusBadge t={t} status={r.status} />
                </button>
                <div className="text-xs text-slate-500">{r.date}</div>
                {r.adminNote && <div className="text-xs text-amber-700">{t.reviewNotePh}: {r.adminNote}</div>}

                {expandedId === r.id && (
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    {r.type === "profile_update" ? (
                      <>
                        <div className="flex justify-between text-xs"><span className="text-slate-500">{t.shopName}</span><span>{r.payload.name}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-slate-500">{t.city}</span><span>{r.payload.city}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-slate-500">{t.contactNumber}</span><span>{r.payload.phone}</span></div>
                      </>
                    ) : (
                      partFieldDefs.concat([{ key: "price", label: t.price }]).map(({ key, label }) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-slate-500">{label}</span>
                          <span>{r.payload[key]}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {r.status === "returned" && editingRequest !== r.id && (
                  <button onClick={() => startEdit(r)} className="text-xs text-amber-600">{t.resubmitBtn}</button>
                )}

                {editingRequest === r.id && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {Object.keys(editForm).map((key) => (
                      <input
                        key={key}
                        value={editForm[key]}
                        onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      />
                    ))}
                    <button onClick={submitEdit} className="w-full bg-slate-900 text-white text-xs py-2 rounded-lg">{t.submitRequest}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminLogin({ t, onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!username.trim() || !password.trim()) {
      setError(t.loginFillFields);
      return;
    }
    // Demo-only check — replace with a real server-side login endpoint before launch.
    if (username === "admin" && password === "admin123") {
      setError("");
      onSuccess();
    } else {
      setError(t.loginError);
    }
  }

  return (
    <div className="p-6 max-w-xs mx-auto space-y-4">
      <h2 className="text-base font-medium text-center">{t.adminLoginTitle}</h2>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-500 block mb-1">{t.username}</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">{t.password}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button onClick={handleSubmit} className="w-full bg-slate-900 text-white text-sm py-2.5 rounded-lg font-medium">
          {t.loginBtn}
        </button>
      </div>
    </div>
  );
}

function SupplierRequestsReview({ t, lang, requests, onReview }) {
  const [notes, setNotes] = useState({});

  function renderPayload(r) {
    if (r.type === "profile_update") {
      return `${r.payload.name} · ${r.payload.city} · ${r.payload.phone}`;
    }
    if (r.type === "update_part") {
      const p = r.payload;
      return `${t.quantityField}: ${p.quantity} · ${t.price}: ${p.price}${p.image ? ` · ${t.uploadImage}` : ""}`;
    }
    const p = r.payload;
    return `${p.partName} (${p.partNumber}) · ${p.manufacturer} · ${p.carMake} ${p.carType} ${p.year} · ${p.cylinders}cyl ${p.engineSize}`;
  }

  return (
    <div className="space-y-2">
      {requests.length === 0 && <p className="text-sm text-slate-400 text-center py-8">{t.noSupplierRequests}</p>}
      {requests.map((r) => (
        <div key={r.id} className="border border-slate-200 rounded-xl p-3 space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium">{L(r.supplierName, lang)}</span>
            <RequestStatusBadge t={t} status={r.status} />
          </div>
          <div className="text-xs text-slate-500">{requestTypeLabel(t, r.type)}</div>
          <div className="text-xs text-slate-600">{renderPayload(r)}</div>
          <div className="text-xs text-slate-400">{r.date}</div>
          {r.status === "pending" && (
            <div className="space-y-2 pt-1">
              <input
                placeholder={t.reviewNotePh}
                value={notes[r.id] || ""}
                onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
              />
              <div className="flex gap-2">
                <button onClick={() => onReview(r.id, "approved", notes[r.id])} className="flex-1 bg-emerald-600 text-white text-xs py-1.5 rounded-lg">{t.approveBtn}</button>
                <button onClick={() => onReview(r.id, "returned", notes[r.id])} className="flex-1 bg-amber-500 text-slate-900 text-xs py-1.5 rounded-lg">{t.returnBtn}</button>
                <button onClick={() => onReview(r.id, "rejected", notes[r.id])} className="flex-1 bg-red-500 text-white text-xs py-1.5 rounded-lg">{t.rejectBtn}</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PhotoRequestsAdmin({ t, lang, requests, suppliers, onSendToSuppliers }) {
  const [expandedId, setExpandedId] = useState(null);
  const [pickerFor, setPickerFor] = useState(null);
  const [checked, setChecked] = useState([]);

  function openPicker(id) {
    setPickerFor(id);
    setChecked([]);
  }

  function toggleSupplier(id) {
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const [sendResultMsg, setSendResultMsg] = useState("");

  async function confirmSend() {
    const result = await onSendToSuppliers(pickerFor, checked);
    setPickerFor(null);
    if (!result) return;
    if (result.emailFailures && result.emailFailures.length === checked.length) {
      setSendResultMsg(t.sendFailedAll);
    } else if (result.emailFailures && result.emailFailures.length > 0) {
      setSendResultMsg(t.sendPartialFail(result.emailFailures.length, checked.length));
    } else {
      setSendResultMsg(t.sendSuccessAll);
    }
  }

  return (
    <div className="space-y-2">
      {sendResultMsg && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-3 text-xs text-amber-800 flex justify-between items-start gap-2">
          <span>{sendResultMsg}</span>
          <button onClick={() => setSendResultMsg("")}><X size={14} /></button>
        </div>
      )}
      {requests.length === 0 && <p className="text-sm text-slate-400 text-center py-8">{t.noPhotoRequests}</p>}
      {requests.map((r) => (
        <div key={r.id} className="border border-slate-200 rounded-xl p-3 space-y-2 text-sm">
          <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} className="w-full flex justify-between items-center text-start">
            <span className="text-xs font-medium">{L(r.customerName, lang)}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${r.status === "sent_to_suppliers" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
              {r.status === "sent_to_suppliers" ? t.photoReqSentToSuppliers : t.photoReqPending}
            </span>
          </button>
          <div className="text-xs text-slate-500">{[r.carMake, r.carType, r.year].filter(Boolean).join(" · ")} · {r.date}</div>

          {expandedId === r.id && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {r.image && <img src={r.image} alt="" className="w-full h-40 object-cover rounded-lg" />}
              {r.cylinders && <div className="text-xs text-slate-600">{t.cylindersLabel}: {r.cylinders}</div>}
              {r.engineSize && <div className="text-xs text-slate-600">{t.engineSizeLabel}: {r.engineSize}</div>}
              <div className="text-xs text-slate-600">{t.quantityField}: {r.quantity || 1}</div>
              <button onClick={() => openPicker(r.id)} className="w-full bg-slate-900 text-white text-xs py-2 rounded-lg">
                {t.sendToSuppliersBtn}
              </button>
            </div>
          )}
        </div>
      ))}

      {pickerFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setPickerFor(null)}>
          <div className="bg-white rounded-xl p-5 w-full max-w-xs space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">{t.chooseSuppliersTitle}</h3>
              <button onClick={() => setPickerFor(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {suppliers.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm border border-slate-200 rounded-lg px-3 py-2">
                  <input type="checkbox" checked={checked.includes(s.id)} onChange={() => toggleSupplier(s.id)} />
                  <span className="flex-1">{L(s.name, lang)}</span>
                  {!s.email && <span className="text-xs text-red-500">{t.noSupplierEmail}</span>}
                </label>
              ))}
            </div>
            <button onClick={confirmSend} disabled={checked.length === 0} className="w-full bg-amber-500 text-slate-900 text-sm py-2.5 rounded-lg font-medium disabled:opacity-50">
              {t.confirmSendBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminDashboard({ t, lang, currency, screen, setScreen, customers, suppliers, parts, orders, onAdvance, newPart, setNewPart, onAddPart, onUpdatePart, newSupplier, setNewSupplier, onAddSupplier, supplierError, partRequests, onMarkFulfilled, supplierRequests, onReviewSupplierRequest, photoRequests, onSendToSuppliers, onUpdateSupplier, onDeleteSupplier }) {
  const tabs = [
    { key: "overview", label: t.overview, icon: LayoutDashboard },
    { key: "orders", label: t.ordersTab, icon: ClipboardList },
    { key: "parts", label: t.partsTab, icon: Package },
    { key: "requests", label: t.partRequestsTab, icon: Bell },
    { key: "photoRequests", label: t.photoRequestsTab, icon: Camera },
    { key: "supplierRequests", label: t.adminSupplierRequestsTab, icon: Bell },
    { key: "suppliers", label: t.suppliersTab, icon: Store },
    { key: "customers", label: t.customersTab, icon: Users },
  ];
  const activeTab = ["overview", "orders", "parts", "requests", "photoRequests", "supplierRequests", "suppliers", "customers"].includes(screen) ? screen : "overview";
  const totalCommission = orders.reduce((s, o) => s + o.commission, 0);
  const totalSales = orders.reduce((s, o) => s + o.total, 0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [editingPart, setEditingPart] = useState(null);
  const [editPartForm2, setEditPartForm2] = useState(null);
  const [editPartError, setEditPartError] = useState("");

  function startEditPart2(p) {
    setEditingPart(p);
    setEditPartForm2({
      name: L(p.name, lang) || "", make: L(p.make, lang) || "", model: L(p.model, lang) || "", year: p.year || "",
      price: String(p.price || ""), quantity: p.quantity !== undefined ? String(p.quantity) : "", sku: p.sku || "",
      aliases: (p.aliases || []).join(", "), image: p.image || null,
    });
    setEditPartError("");
  }

  async function saveEditPart2() {
    if (!editPartForm2.name.trim() || !editPartForm2.price.trim()) {
      setEditPartError(t.requestFillFields);
      return;
    }
    const aliasesArray = editPartForm2.aliases.split(",").map((a) => a.trim()).filter(Boolean);
    const ok = await onUpdatePart(editingPart.id, {
      ...editPartForm2,
      aliases: aliasesArray,
      price: Number(editPartForm2.price),
      quantity: Number(editPartForm2.quantity) || 0,
    });
    if (ok) setEditingPart(null);
    else setEditPartError(t.apiOffline);
  }

  const [editSupplierForm, setEditSupplierForm] = useState(null);
  const [editSupplierError, setEditSupplierError] = useState("");

  function startEditSupplier(s) {
    setEditingSupplier(s);
    setEditSupplierForm({
      name: L(s.name, lang), city: L(s.city, lang), phone: s.phone || "", email: s.email || "",
      username: s.username || "", password: "",
    });
    setEditSupplierError("");
  }

  async function saveSupplierEdit() {
    if (!editSupplierForm.name.trim() || !editSupplierForm.phone.trim() || !editSupplierForm.email.trim() || !editSupplierForm.username.trim()) {
      setEditSupplierError(t.fillShopFields);
      return;
    }
    const ok = await onUpdateSupplier(editingSupplier.id, editSupplierForm);
    if (ok) setEditingSupplier(null);
    else setEditSupplierError(t.apiOffline);
  }

  return (
    <div>
      <div className="flex overflow-x-auto border-b border-slate-200">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setScreen(key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs whitespace-nowrap border-b-2 ${activeTab === key ? "border-amber-500 text-slate-900" : "border-transparent text-slate-400"}`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === "overview" && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Wallet} label={t.totalCommission} value={formatPrice(totalCommission, currency, lang)} />
            <StatCard icon={ClipboardList} label={t.totalSales} value={formatPrice(totalSales, currency, lang)} />
            <StatCard icon={Store} label={t.suppliersCount} value={suppliers.length} />
            <StatCard icon={Package} label={t.availableParts} value={parts.length} />
            <StatCard icon={Users} label={t.customersCount} value={customers.length} />
            <StatCard icon={Truck} label={t.ongoingOrders} value={orders.filter((o) => o.stage !== t.stages.length - 1).length} />
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="border border-slate-200 rounded-xl p-4 space-y-2">
                <button onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)} className="w-full flex justify-between text-sm text-start">
                  <span className="font-medium">{o.id}</span>
                  <span className="text-slate-400 text-xs">{o.date}</span>
                </button>
                <div className="text-xs text-slate-500">{t.customerLabel}: {L(o.customerName, lang)}</div>
                {o.vin && (
                  <div className="text-xs text-emerald-700">{t.vinAttached}: {o.vin}{o.vinInfo ? ` · ${o.vinInfo.make} ${o.vinInfo.model} ${o.vinInfo.year}` : ""}</div>
                )}
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{t.totalColon}: {formatPrice(o.total, currency, lang)}</span>
                  <span>{t.commissionColon}: {formatPrice(o.commission, currency, lang)}</span>
                </div>

                {expandedOrderId === o.id && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    {(o.items || []).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {item.image ? <img src={item.image} alt={L(item.name, lang)} className="w-full h-full object-cover" /> : <Package size={12} className="text-slate-300" />}
                        </div>
                        <span className="flex-1">{L(item.name, lang)}</span>
                        <span className="text-slate-400">× {item.qty}</span>
                        <span className="text-amber-600">{formatPrice(item.price * item.qty, currency, lang)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100">{t.stages[o.stage]}</span>
                  {o.stage !== t.stages.length - 1 && (
                    <button onClick={() => onAdvance(o.id)} className="text-xs text-amber-600 flex items-center gap-1">
                      {t.nextStage} <ChevronLeft size={12} className="ltr:rotate-180" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "parts" && (
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-medium mb-1">{t.addNewPart}</h3>
              <input placeholder={t.partName} value={newPart.name} onChange={(e) => setNewPart({ ...newPart, name: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder={t.make} value={newPart.make} onChange={(e) => setNewPart({ ...newPart, make: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <input placeholder={t.model} value={newPart.model} onChange={(e) => setNewPart({ ...newPart, model: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder={t.years} value={newPart.year} onChange={(e) => setNewPart({ ...newPart, year: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <input placeholder={t.price} type="number" value={newPart.price} onChange={(e) => setNewPart({ ...newPart, price: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <input placeholder={t.quantityField} type="number" min="0" value={newPart.quantity} onChange={(e) => setNewPart({ ...newPart, quantity: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder={t.searchPartNumber} value={newPart.sku} onChange={(e) => setNewPart({ ...newPart, sku: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <div>
                <input
                  placeholder={t.aliasesPh}
                  value={newPart.aliases}
                  onChange={(e) => setNewPart({ ...newPart, aliases: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">{t.aliasesLabel}</p>
              </div>
              <select value={newPart.supplierId} onChange={(e) => setNewPart({ ...newPart, supplierId: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {suppliers.map((s) => <option key={s.id} value={s.id}>{L(s.name, lang)}</option>)}
              </select>

              <div>
                <label className="text-xs text-slate-500 block mb-1">{t.uploadImage}</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                    {newPart.image ? (
                      <img src={newPart.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package size={20} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="w-full text-center block border border-dashed border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-500 cursor-pointer">
                      {newPart.image ? t.changeImage : t.uploadFromDevice}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files && e.target.files[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => setNewPart((p) => ({ ...p, image: reader.result }));
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    {newPart.image && (
                      <button type="button" onClick={() => setNewPart((p) => ({ ...p, image: null }))} className="text-xs text-red-500">
                        {t.removeImage}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <button onClick={onAddPart} className="w-full bg-slate-900 text-white text-sm py-2 rounded-lg mt-1">{t.addPartBtn}</button>
            </div>
            <div className="space-y-2">
              {parts.map((p) => (
                <div key={p.id} className="flex items-center gap-3 border border-slate-200 rounded-xl p-3 text-sm">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {p.image ? <img src={p.image} alt={L(p.name, lang)} className="w-full h-full object-cover" /> : <Package size={16} className="text-slate-300" />}
                  </div>
                  <div className="flex-1">
                    <div>{L(p.name, lang)}</div>
                    <div className="text-xs text-slate-400">{L(p.make, lang)} {L(p.model, lang)} · {L(suppliers.find((s) => s.id === p.supplierId)?.name, lang)} · {t.quantityField}: {p.quantity ?? 0}</div>
                    {!!(p.aliases && p.aliases.length) && (
                      <div className="text-xs text-slate-300 mt-0.5">{p.aliases.join("، ")}</div>
                    )}
                  </div>
                  <span className="text-amber-600">{formatPrice(p.price, currency, lang)}</span>
                  <button onClick={() => startEditPart2(p)} className="text-xs text-amber-600 ms-2">{t.editBtn}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "requests" && (
          <div className="space-y-2">
            {partRequests.length === 0 && <p className="text-sm text-slate-400 text-center py-8">{t.noPartRequests}</p>}
            {partRequests.map((r) => (
              <div key={r.id} className="border border-slate-200 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{r.partName}</span>
                  <span className="text-xs text-slate-400">{r.date}</span>
                </div>
                <div className="text-xs text-slate-500">{r.carType} · {r.year}</div>
                <div className="text-xs text-slate-500">{r.name} · {r.phone} · {r.email}</div>
                <div className="flex items-center justify-between pt-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${r.fulfilled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {r.fulfilled ? t.fulfilledBadge : t.pendingBadge}
                  </span>
                  {!r.fulfilled && (
                    <button onClick={() => onMarkFulfilled(r.id)} className="text-xs text-amber-600">
                      {t.markFulfilled}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "photoRequests" && (
          <PhotoRequestsAdmin t={t} lang={lang} requests={photoRequests} suppliers={suppliers} onSendToSuppliers={onSendToSuppliers} />
        )}

        {activeTab === "supplierRequests" && (
          <SupplierRequestsReview t={t} lang={lang} requests={supplierRequests} onReview={onReviewSupplierRequest} />
        )}

        {activeTab === "suppliers" && (
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-medium mb-1">{t.createSupplierTitle}</h3>
              <p className="text-xs text-slate-400 mb-1">{t.noSelfRegNote}</p>
              <input placeholder={t.shopName} value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder={t.city} value={newSupplier.city} onChange={(e) => setNewSupplier({ ...newSupplier, city: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <input placeholder={t.contactNumber} value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <input placeholder={t.emailLabel} type="email" value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder={t.username} value={newSupplier.username} onChange={(e) => setNewSupplier({ ...newSupplier, username: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <input placeholder={t.password} type="text" value={newSupplier.password} onChange={(e) => setNewSupplier({ ...newSupplier, password: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <p className="text-xs text-slate-400">{t.supplierLoginNote}</p>
              {supplierError && <p className="text-xs text-red-600">{supplierError}</p>}
              <button onClick={onAddSupplier} className="w-full bg-slate-900 text-white text-sm py-2 rounded-lg mt-1">{t.createAccountBtn}</button>
            </div>
            <div className="space-y-2">
              {suppliers.map((s) => (
                <div key={s.id} className="border border-slate-200 rounded-xl p-3 flex justify-between items-center text-sm">
                  <div>
                    <div>{L(s.name, lang)}</div>
                    <div className="text-xs text-slate-400">{L(s.city, lang)}{s.rating ? ` · ${s.rating}` : ""}{s.email ? ` · ${s.email}` : ""}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{s.partsCount}</span>
                    <button onClick={() => startEditSupplier(s)} className="text-xs text-amber-600">{t.editBtn}</button>
                    <button
                      onClick={() => { if (window.confirm(t.confirmDeleteSupplier(L(s.name, lang)))) onDeleteSupplier(s.id); }}
                      className="text-xs text-red-500"
                    >
                      {t.deleteBtn}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 pt-1">{t.hiddenIdentityNote}</p>
          </div>
        )}

        {activeTab === "customers" && (
          <div className="space-y-2">
            {customers.length === 0 && <p className="text-sm text-slate-400 text-center py-8">{t.noCustomers}</p>}
            {customers.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                className="w-full border border-slate-200 rounded-xl p-3 flex justify-between items-center text-sm text-start hover:border-amber-300"
              >
                <span>{c.name}</span>
                <span className="text-xs text-slate-400">{c.phone}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setSelectedCustomer(null)}>
          <div className="bg-white rounded-xl p-5 w-full max-w-xs space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">{t.customerDetailsTitle}</h3>
              <button onClick={() => setSelectedCustomer(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">{t.fullName}</span><span>{selectedCustomer.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">{t.username}</span><span>{selectedCustomer.username}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">{t.phone}</span><span>{selectedCustomer.phone}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">{t.emailLabel}</span><span>{selectedCustomer.email}</span></div>
            </div>
          </div>
        </div>
      )}

      {editingSupplier && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setEditingSupplier(null)}>
          <div className="bg-white rounded-xl p-5 w-full max-w-xs space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">{t.editSupplierTitle}</h3>
              <button onClick={() => setEditingSupplier(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <input placeholder={t.shopName} value={editSupplierForm.name} onChange={(e) => setEditSupplierForm({ ...editSupplierForm, name: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder={t.city} value={editSupplierForm.city} onChange={(e) => setEditSupplierForm({ ...editSupplierForm, city: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder={t.contactNumber} value={editSupplierForm.phone} onChange={(e) => setEditSupplierForm({ ...editSupplierForm, phone: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <input placeholder={t.emailLabel} type="email" value={editSupplierForm.email} onChange={(e) => setEditSupplierForm({ ...editSupplierForm, email: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder={t.username} value={editSupplierForm.username} onChange={(e) => setEditSupplierForm({ ...editSupplierForm, username: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder={t.newPasswordPh} value={editSupplierForm.password} onChange={(e) => setEditSupplierForm({ ...editSupplierForm, password: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            {editSupplierError && <p className="text-xs text-red-600">{editSupplierError}</p>}
            <button onClick={saveSupplierEdit} className="w-full bg-slate-900 text-white text-sm py-2.5 rounded-lg font-medium">{t.saveBtn}</button>
          </div>
        </div>
      )}

      {editingPart && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setEditingPart(null)}>
          <div className="bg-white rounded-xl p-5 w-full max-w-xs space-y-3 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">{t.editPartTitle}</h3>
              <button onClick={() => setEditingPart(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <input placeholder={t.partName} value={editPartForm2.name} onChange={(e) => setEditPartForm2({ ...editPartForm2, name: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder={t.make} value={editPartForm2.make} onChange={(e) => setEditPartForm2({ ...editPartForm2, make: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder={t.model} value={editPartForm2.model} onChange={(e) => setEditPartForm2({ ...editPartForm2, model: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder={t.years} value={editPartForm2.year} onChange={(e) => setEditPartForm2({ ...editPartForm2, year: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder={t.price} type="number" value={editPartForm2.price} onChange={(e) => setEditPartForm2({ ...editPartForm2, price: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder={t.quantityField} type="number" min="0" value={editPartForm2.quantity} onChange={(e) => setEditPartForm2({ ...editPartForm2, quantity: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder={t.searchPartNumber} value={editPartForm2.sku} onChange={(e) => setEditPartForm2({ ...editPartForm2, sku: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <input placeholder={t.aliasesPh} value={editPartForm2.aliases} onChange={(e) => setEditPartForm2({ ...editPartForm2, aliases: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <div>
              <label className="text-xs text-slate-500 block mb-1">{t.uploadImage}</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                  {editPartForm2.image ? <img src={editPartForm2.image} alt="" className="w-full h-full object-cover" /> : <Package size={18} className="text-slate-300" />}
                </div>
                <label className="flex-1 text-center border border-dashed border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-500 cursor-pointer">
                  {editPartForm2.image ? t.changeImage : t.uploadFromDevice}
                  <input
                    type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const file = e.target.files && e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setEditPartForm2((f) => ({ ...f, image: reader.result }));
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>
            </div>
            {editPartError && <p className="text-xs text-red-600">{editPartError}</p>}
            <button onClick={saveEditPart2} className="w-full bg-slate-900 text-white text-sm py-2.5 rounded-lg font-medium">{t.saveBtn}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="border border-slate-200 rounded-xl p-3">
      <Icon size={16} className="text-amber-600 mb-2" />
      <div className="text-base font-medium">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
