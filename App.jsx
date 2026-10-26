import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, ArrowUpRight, Check, CircleHelp, Copy, Globe, Menu,
  Music2, Pause, Play, Radio, ShieldCheck, Sparkles, X
} from "lucide-react";
import {
  getHealth, installWhatsApp, getWhatsAppStatus
} from "./api/sungApi.js";
import { t } from "./i18n/index.js";

// SUNG BOT Images & Media
const IMG = "https://upload.satoru.click/files/5d6ca1.jpg"; // صورة السونج
const AUDIO = "https://www.zapsplat.com/wp-content/uploads/2015/sound-effects/environments/forest/forest_ambience_light_breeze_bird_singing_01.mp3"; // غابة + رياح + عصافير - رايق
const VIDEO = ""; // فيديو تيك توك (اختياري)

const links = [
  ["bot", "https://t.me/Sung_Alm_Bot"],
  ["channel", ""],
  ["group", ""],
  ["developer", "https://t.me/yourusername"],
  ["wa", "https://whatsapp.com/channel/0029VbDyzdv9hXFFPnaxcN14"],
  ["waGroup", ""],
];

const countries = [
  ["Afghanistan", "+93", "🇦🇫"],
  ["Albania", "+355", "🇦🇱"],
  ["Algeria", "+213", "🇩🇿"],
  ["American Samoa", "+1", "🇦🇸"],
  ["Andorra", "+376", "🇦🇩"],
  ["Angola", "+244", "🇦🇴"],
  ["Anguilla", "+1", "🇦🇮"],
  ["Antarctica", "+672", "🇦🇶"],
  ["Antigua and Barbuda", "+1", "🇦🇬"],
  ["Argentina", "+54", "🇦🇷"],
  ["Armenia", "+374", "🇦🇲"],
  ["Aruba", "+297", "🇦🇼"],
  ["Australia", "+61", "🇦🇺"],
  ["Austria", "+43", "🇦🇹"],
  ["Azerbaijan", "+994", "🇦🇿"],
  ["Bahamas", "+1", "🇧🇸"],
  ["Bahrain", "+973", "🇧🇭"],
  ["Bangladesh", "+880", "🇧🇩"],
  ["Barbados", "+1", "🇧🇧"],
  ["Belarus", "+375", "🇧🇾"],
  ["Belgium", "+32", "🇧🇪"],
  ["Belize", "+501", "🇧🇿"],
  ["Benin", "+229", "🇧🇯"],
  ["Bermuda", "+1", "🇧🇲"],
  ["Bhutan", "+975", "🇧🇹"],
  ["Bolivia", "+591", "🇧🇴"],
  ["Bosnia and Herzegovina", "+387", "🇧🇦"],
  ["Botswana", "+267", "🇧🇼"],
  ["Bouvet Island", "+47", "🇧🇻"],
  ["Brazil", "+55", "🇧🇷"],
  ["British Indian Ocean Territory", "+246", "🇮🇴"],
  ["Brunei", "+673", "🇧🇳"],
  ["Bulgaria", "+359", "🇧🇬"],
  ["Burkina Faso", "+226", "🇧🇫"],
  ["Burundi", "+257", "🇧🇮"],
  ["Cabo Verde", "+238", "🇨🇻"],
  ["Cambodia", "+855", "🇰🇭"],
  ["Cameroon", "+237", "🇨🇲"],
  ["Canada", "+1", "🇨🇦"],
  ["Caribbean Netherlands", "+599", "🇧🇶"],
  ["Cayman Islands", "+1", "🇰🇾"],
  ["Central African Republic", "+236", "🇨🇫"],
  ["Chad", "+235", "🇹🇩"],
  ["Chile", "+56", "🇨🇱"],
  ["China", "+86", "🇨🇳"],
  ["Christmas Island", "+61", "🇨🇽"],
  ["Cocos (Keeling) Islands", "+61", "🇨🇨"],
  ["Colombia", "+57", "🇨🇴"],
  ["Comoros", "+269", "🇰🇲"],
  ["Cook Islands", "+682", "🇨🇰"],
  ["Costa Rica", "+506", "🇨🇷"],
  ["Croatia", "+385", "🇭🇷"],
  ["Cuba", "+53", "🇨🇺"],
  ["Curaçao", "+599", "🇨🇼"],
  ["Cyprus", "+357", "🇨🇾"],
  ["Czechia", "+420", "🇨🇿"],
  ["Côte d’Ivoire", "+225", "🇨🇮"],
  ["Denmark", "+45", "🇩🇰"],
  ["Djibouti", "+253", "🇩🇯"],
  ["Dominica", "+1", "🇩🇲"],
  ["Dominican Republic", "+1", "🇩🇴"],
  ["DR Congo", "+243", "🇨🇩"],
  ["Ecuador", "+593", "🇪🇨"],
  ["Egypt", "+20", "🇪🇬"],
  ["El Salvador", "+503", "🇸🇻"],
  ["Equatorial Guinea", "+240", "🇬🇶"],
  ["Eritrea", "+291", "🇪🇷"],
  ["Estonia", "+372", "🇪🇪"],
  ["Eswatini", "+268", "🇸🇿"],
  ["Ethiopia", "+251", "🇪🇹"],
  ["Falkland Islands (Malvinas)", "+500", "🇫🇰"],
  ["Faroe Islands", "+298", "🇫🇴"],
  ["Fiji", "+679", "🇫🇯"],
  ["Finland", "+358", "🇫🇮"],
  ["France", "+33", "🇫🇷"],
  ["French Guiana", "+594", "🇬🇫"],
  ["French Polynesia", "+689", "🇵🇫"],
  ["French Southern Territories", "+262", "🇹🇫"],
  ["Gabon", "+241", "🇬🇦"],
  ["Gambia", "+220", "🇬🇲"],
  ["Georgia", "+995", "🇬🇪"],
  ["Germany", "+49", "🇩🇪"],
  ["Ghana", "+233", "🇬🇭"],
  ["Gibraltar", "+350", "🇬🇮"],
  ["Greece", "+30", "🇬🇷"],
  ["Greenland", "+299", "🇬🇱"],
  ["Grenada", "+1", "🇬🇩"],
  ["Guadeloupe", "+590", "🇬🇵"],
  ["Guam", "+1", "🇬🇺"],
  ["Guatemala", "+502", "🇬🇹"],
  ["Guernsey", "+44", "🇬🇬"],
  ["Guinea", "+224", "🇬🇳"],
  ["Guinea-Bissau", "+245", "🇬🇼"],
  ["Guyana", "+592", "🇬🇾"],
  ["Haiti", "+509", "🇭🇹"],
  ["Heard Island and McDonald Islands", "+672", "🇭🇲"],
  ["Honduras", "+504", "🇭🇳"],
  ["Hong Kong", "+852", "🇭🇰"],
  ["Hungary", "+36", "🇭🇺"],
  ["Iceland", "+354", "🇮🇸"],
  ["India", "+91", "🇮🇳"],
  ["Indonesia", "+62", "🇮🇩"],
  ["Iran", "+98", "🇮🇷"],
  ["Iraq", "+964", "🇮🇶"],
  ["Ireland", "+353", "🇮🇪"],
  ["Isle of Man", "+44", "🇮🇲"],
  ["Israel", "+972", "🇮🇱"],
  ["Italy", "+39", "🇮🇹"],
  ["Jamaica", "+1", "🇯🇲"],
  ["Japan", "+81", "🇯🇵"],
  ["Jersey", "+44", "🇯🇪"],
  ["Jordan", "+962", "🇯🇴"],
  ["Kazakhstan", "+7", "🇰🇿"],
  ["Kenya", "+254", "🇰🇪"],
  ["Kiribati", "+686", "🇰🇮"],
  ["Kosovo", "+383", "🇽🇰"],
  ["Kuwait", "+965", "🇰🇼"],
  ["Kyrgyzstan", "+996", "🇰🇬"],
  ["Laos", "+856", "🇱🇦"],
  ["Latvia", "+371", "🇱🇻"],
  ["Lebanon", "+961", "🇱🇧"],
  ["Lesotho", "+266", "🇱🇸"],
  ["Liberia", "+231", "🇱🇷"],
  ["Libya", "+218", "🇱🇾"],
  ["Liechtenstein", "+423", "🇱🇮"],
  ["Lithuania", "+370", "🇱🇹"],
  ["Luxembourg", "+352", "🇱🇺"],
  ["Macao", "+853", "🇲🇴"],
  ["Madagascar", "+261", "🇲🇬"],
  ["Malawi", "+265", "🇲🇼"],
  ["Malaysia", "+60", "🇲🇾"],
  ["Maldives", "+960", "🇲🇻"],
  ["Mali", "+223", "🇲🇱"],
  ["Malta", "+356", "🇲🇹"],
  ["Marshall Islands", "+692", "🇲🇭"],
  ["Martinique", "+596", "🇲🇶"],
  ["Mauritania", "+222", "🇲🇷"],
  ["Mauritius", "+230", "🇲🇺"],
  ["Mayotte", "+262", "🇾🇹"],
  ["Mexico", "+52", "🇲🇽"],
  ["Micronesia", "+691", "🇫🇲"],
  ["Moldova", "+373", "🇲🇩"],
  ["Monaco", "+377", "🇲🇨"],
  ["Mongolia", "+976", "🇲🇳"],
  ["Montenegro", "+382", "🇲🇪"],
  ["Montserrat", "+1", "🇲🇸"],
  ["Morocco", "+212", "🇲🇦"],
  ["Mozambique", "+258", "🇲🇿"],
  ["Myanmar", "+95", "🇲🇲"],
  ["Namibia", "+264", "🇳🇦"],
  ["Nauru", "+674", "🇳🇷"],
  ["Nepal", "+977", "🇳🇵"],
  ["Netherlands", "+31", "🇳🇱"],
  ["New Caledonia", "+687", "🇳🇨"],
  ["New Zealand", "+64", "🇳🇿"],
  ["Nicaragua", "+505", "🇳🇮"],
  ["Niger", "+227", "🇳🇪"],
  ["Nigeria", "+234", "🇳🇬"],
  ["Niue", "+683", "🇳🇺"],
  ["Norfolk Island", "+672", "🇳🇫"],
  ["North Korea", "+850", "🇰🇵"],
  ["North Macedonia", "+389", "🇲🇰"],
  ["Northern Mariana Islands", "+1", "🇲🇵"],
  ["Norway", "+47", "🇳🇴"],
  ["Oman", "+968", "🇴🇲"],
  ["Pakistan", "+92", "🇵🇰"],
  ["Palau", "+680", "🇵🇼"],
  ["Palestine", "+970", "🇵🇸"],
  ["Panama", "+507", "🇵🇦"],
  ["Papua New Guinea", "+675", "🇵🇬"],
  ["Paraguay", "+595", "🇵🇾"],
  ["Peru", "+51", "🇵🇪"],
  ["Philippines", "+63", "🇵🇭"],
  ["Pitcairn", "+64", "🇵🇳"],
  ["Poland", "+48", "🇵🇱"],
  ["Portugal", "+351", "🇵🇹"],
  ["Puerto Rico", "+1", "🇵🇷"],
  ["Qatar", "+974", "🇶🇦"],
  ["Republic of the Congo", "+242", "🇨🇬"],
  ["Romania", "+40", "🇷🇴"],
  ["Russia", "+7", "🇷🇺"],
  ["Rwanda", "+250", "🇷🇼"],
  ["Réunion", "+262", "🇷🇪"],
  ["Saint Barthélemy", "+590", "🇧🇱"],
  ["Saint Helena, Ascension and Tristan da Cunha", "+290", "🇸🇭"],
  ["Saint Kitts and Nevis", "+1", "🇰🇳"],
  ["Saint Lucia", "+1", "🇱🇨"],
  ["Saint Martin (French part)", "+590", "🇲🇫"],
  ["Saint Pierre and Miquelon", "+508", "🇵🇲"],
  ["Saint Vincent and the Grenadines", "+1", "🇻🇨"],
  ["Samoa", "+685", "🇼🇸"],
  ["San Marino", "+378", "🇸🇲"],
  ["Sao Tome and Principe", "+239", "🇸🇹"],
  ["Saudi Arabia", "+966", "🇸🇦"],
  ["Senegal", "+221", "🇸🇳"],
  ["Serbia", "+381", "🇷🇸"],
  ["Seychelles", "+248", "🇸🇨"],
  ["Sierra Leone", "+232", "🇸🇱"],
  ["Singapore", "+65", "🇸🇬"],
  ["Sint Maarten (Dutch part)", "+1", "🇸🇽"],
  ["Slovakia", "+421", "🇸🇰"],
  ["Slovenia", "+386", "🇸🇮"],
  ["Solomon Islands", "+677", "🇸🇧"],
  ["Somalia", "+252", "🇸🇴"],
  ["South Africa", "+27", "🇿🇦"],
  ["South Georgia and the South Sandwich Islands", "+500", "🇬🇸"],
  ["South Korea", "+82", "🇰🇷"],
  ["South Sudan", "+211", "🇸🇸"],
  ["Spain", "+34", "🇪🇸"],
  ["Sri Lanka", "+94", "🇱🇰"],
  ["Sudan", "+249", "🇸🇩"],
  ["Suriname", "+597", "🇸🇷"],
  ["Svalbard and Jan Mayen", "+47", "🇸🇯"],
  ["Sweden", "+46", "🇸🇪"],
  ["Switzerland", "+41", "🇨🇭"],
  ["Syria", "+963", "🇸🇾"],
  ["Taiwan, Province of China", "+886", "🇹🇼"],
  ["Tajikistan", "+992", "🇹🇯"],
  ["Tanzania", "+255", "🇹🇿"],
  ["Thailand", "+66", "🇹🇭"],
  ["Timor-Leste", "+670", "🇹🇱"],
  ["Togo", "+228", "🇹🇬"],
  ["Tokelau", "+690", "🇹🇰"],
  ["Tonga", "+676", "🇹🇴"],
  ["Trinidad and Tobago", "+1", "🇹🇹"],
  ["Tunisia", "+216", "🇹🇳"],
  ["Turkmenistan", "+993", "🇹🇲"],
  ["Turks and Caicos Islands", "+1", "🇹🇨"],
  ["Tuvalu", "+688", "🇹🇻"],
  ["Türkiye", "+90", "🇹🇷"],
  ["Uganda", "+256", "🇺🇬"],
  ["Ukraine", "+380", "🇺🇦"],
  ["United Arab Emirates", "+971", "🇦🇪"],
  ["United Kingdom", "+44", "🇬🇧"],
  ["United States", "+1", "🇺🇸"],
  ["United States Minor Outlying Islands", "+1", "🇺🇲"],
  ["Uruguay", "+598", "🇺🇾"],
  ["Uzbekistan", "+998", "🇺🇿"],
  ["Vanuatu", "+678", "🇻🇺"],
  ["Vatican City", "+39", "🇻🇦"],
  ["Venezuela", "+58", "🇻🇪"],
  ["Vietnam", "+84", "🇻🇳"],
  ["Virgin Islands, British", "+1", "🇻🇬"],
  ["Virgin Islands, U.S.", "+1", "🇻🇮"],
  ["Wallis and Futuna", "+681", "🇼🇫"],
  ["Western Sahara", "+212", "🇪🇭"],
  ["Yemen", "+967", "🇾🇪"],
  ["Zambia", "+260", "🇿🇲"],
  ["Zimbabwe", "+263", "🇿🇼"],
  ["Åland Islands", "+358", "🇦🇽"]
];

const nav = ["home", "install", "guide", "status", "telegram", "about", "contact"];

function normalizeNumber(value) {
  return String(value || "").replace(/\D/g, "");
}

function statusKind(data) {
  if (data?.connected === true || data?.online === true ||
      data?.status === "connected" || data?.status === "online") return "online";
  if (data?.status === "connecting" || data?.status === "pairing_code") return "connecting";
  if (data?.status === "existing" || data?.status === "offline") return "existing";
  return "unknown";
}

export default function App() {
  const [lang, setLang] = useState(() => sessionStorage.getItem("nova-lang") || "ar");
  const [page, setPage] = useState("home");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [country, setCountry] = useState("Egypt");
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState("idle");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [health, setHealth] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [watchPhone, setWatchPhone] = useState("");
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef(null);

  const rtl = lang === "ar";
  const tr = (key) => t(lang, key);
  const selected = useMemo(
    () => countries.find((item) => item[0] === country) || countries[0],
    [country]
  );

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    sessionStorage.setItem("nova-lang", lang);
  }, [lang, rtl]);

  useEffect(() => {
    let alive = true;
    getHealth().then(d => alive && setHealth(Boolean(d?.success))).catch(() => alive && setHealth(false));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!watchPhone || !["watching", "pairing", "connecting"].includes(state)) return;
    let alive = true;
    let timer;
    const check = async () => {
      if (!alive) return;
      try {
        const data = await getWhatsAppStatus(watchPhone);
        setSessionInfo(data);
        const kind = statusKind(data);
        if (kind === "online") {
          setState("online");
          setMessage("");
          return;
        }
        if (data?.pairingCode && !code) setCode(String(data.pairingCode));
      } catch {}
      if (alive) timer = setTimeout(check, 2500);
    };
    check();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [watchPhone, state, code]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const play = () => audio.play().then(() => setPlaying(true)).catch(() => {});
    audio.load();
    play();
    const resume = () => { if (audio.paused) play(); };
    window.addEventListener("pointerdown", resume, { once: true, passive: true });
    window.addEventListener("keydown", resume, { once: true });
    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
  }, []);

  const go = (next) => {
    setPage(next);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const errorKey = (error) => {
    const key = error?.data?.errorCode;
    if (key === "SESSION_ALREADY_INSTALLED") return "alreadyInstalled";
    if (key === "SESSION_EXISTS_OFFLINE") return "existingSession";
    if (key === "SESSION_ALREADY_CONNECTING") return "alreadyConnecting";
    if (error?.status === 409) return "alreadyInstalled";
    if (error?.message === "network" || error?.message === "timeout" || error?.message === "invalid_response") return error.message;
    if (error?.status === 400) return "http400";
    if (error?.status === 404) return "http404";
    if (error?.status === 405) return "http405";
    if (error?.status >= 500) return "http500";
    return "unknown";
  };

  const submit = async (event) => {
    event.preventDefault();
    const digits = normalizeNumber(number);
    if (digits.length < 6 || digits.length > 14) {
      setState("error"); setMessage(tr("invalid")); return;
    }

    const phone = `${selected[1].slice(1)}${digits}`;
    setBusy(true);
    setMessage("");
    setCode("");
    setSessionInfo(null);
    setWatchPhone(phone);
    setState("connecting");

    try {
      const data = await installWhatsApp(phone);
      setSessionInfo(data);
      const realCode = data?.pairingCode || data?.code || data?.pairing_code || "";
      if (realCode) setCode(String(realCode));

      const kind = statusKind(data);
      if (kind === "online") {
        setState("online");
      } else {
        setState("pairing");
      }
    } catch (error) {
      setState("error");
      setMessage(tr(errorKey(error)));
      setSessionInfo(error?.data || null);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!code) return;
    try { await navigator.clipboard.writeText(code); }
    catch {
      const el = document.createElement("textarea");
      el.value = code; document.body.appendChild(el); el.select();
      document.execCommand("copy"); el.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const refreshHealth = () => {
    setHealth(null);
    getHealth().then(d => setHealth(Boolean(d?.success))).catch(() => setHealth(false));
  };

  const statusLabel =
    state === "online" ? tr("online") :
    state === "connecting" ? tr("connecting") :
    state === "pairing" ? tr("waiting") :
    state === "error" ? tr("offline") : tr("idle");

  return (
    <div className="app">
      <div className="cosmicGrid" /><div className="stars starsA" /><div className="stars starsB" />
      <div className="nebula nebulaOne" /><div className="nebula nebulaTwo" />
      <div className="meteor meteorOne" /><div className="meteor meteorTwo" />

      {mobileMenu && <button className="menuBackdrop" aria-label={tr("closeMenu")} onClick={() => setMobileMenu(false)} />}

      <header className="nav">
        <button className="menuBtn" aria-expanded={mobileMenu} onClick={() => setMobileMenu(v => !v)}>
          {mobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
        <button className="wordmark" onClick={() => go("home")}><span className="wordmarkStar">✦</span>NOVA<span className="wordmarkDot">·</span></button>
        <div className="navtools">
          <div className="navStatus"><span /> NOVA CORE</div>
          <select value={lang} onChange={e => setLang(e.target.value)} aria-label={tr("language")}>
            <option value="ar">عربي</option><option value="en">EN</option>
          </select>
        </div>
        <nav className={mobileMenu ? "navDrawer open" : "navDrawer"}>
          <div className="drawerTop"><div><p className="eyebrow">✦ NOVA / SYSTEM</p><strong>{tr("menuTitle")}</strong></div>
            <button className="drawerClose" onClick={() => setMobileMenu(false)}><X size={20}/></button>
          </div>
          <div className="drawerLinks">{nav.map((item,i) =>
            <button className={page === item ? "drawerLink active" : "drawerLink"} key={item} onClick={() => go(item)}>
              <span className="drawerNumber">0{i+1}</span><span>{tr(item)}</span><ArrowUpRight size={16}/>
            </button>
          )}</div>
          <div className="drawerFooter"><span>🌌 NOVA</span><span>TAHA / CORE</span></div>
        </nav>
      </header>

      <main>
        {page === "home" && <>
          <section className="hero">
            <div className="heroCopy">
              <p className="eyebrow">✦ {tr("eyebrow")}</p>
              <div className="heroBadge"><Sparkles size={14}/> 𝑵𝒐𝒗𝒂 🌌</div>
              <h1>NOVA<span>.</span></h1><h2>{tr("heroTitle")}</h2><p>{tr("heroText")}</p>
              <div className="actions">
                <button className="primary" onClick={() => go("install")}>🛰️ {tr("installNow")} ↗</button>
                <button className="secondary" onClick={() => go("guide")}>📡 {tr("guide")}</button>
              </div>
              <button className="textlink" onClick={() => go("about")}>✦ {tr("explore")} ↗</button>
              <div className="heroStats"><div><b>01</b><span>{tr("heroStatOne")}</span></div><div><b>∞</b><span>{tr("heroStatTwo")}</span></div><div><b>24/7</b><span>{tr("heroStatThree")}</span></div></div>
            </div>
            <div className="heroVisual" aria-hidden="true">
              <div className="spaceRing ringOne"/><div className="spaceRing ringTwo"/><div className="spaceRing ringThree"/>
              <div className="planetGlow"/><div className="planet"><img src={IMG} alt="NOVA emblem"/></div>
              <div className="planetCaption">NOVA / WHATSAPP ORBIT</div><i className="orbitDot d1"/><i className="orbitDot d2"/><i className="orbitDot d3"/>
            </div>
          </section>
          <section className="intro"><p className="eyebrow">01 / NOVA</p><h2>{tr("how")}</h2><p className="sectionLead">{tr("howText")}</p>
            <div className="steps">{["step1","step2","step3","step4","step5"].map((step,i)=>
              <article className="step" key={step}><small>0{i+1}</small><span className="stepIcon">{["📱","🚀","🔐","📡","🟢"][i]}</span><p>{tr(step)}</p></article>
            )}</div>
          </section>
        </>}

        {page === "install" && <section className="pageSection installPage">
          <div className="sectionHeader"><div><p className="eyebrow">NOVA / TERMINAL 01</p><h1>{tr("installTitle")}</h1><p className="lead">{tr("installLead")}</p></div><div className="headerOrb">🌌</div></div>
          <div className="terminal">
            <div className="terminalTop"><span>● ● ●</span><span>NOVA CORE / WHATSAPP</span><span className={health ? "live" : "offlineText"}>● {health ? tr("serverUp") : tr("serverDown")}</span></div>
            <div className="terminalBody">
              <div className="installNotice"><span>✦</span><p>{tr("noCode")}</p></div>
              <form onSubmit={submit}>
                <label htmlFor="nova-phone">{tr("phone")}</label>
                <div className="phoneRow">
                  <select value={country} onChange={e => setCountry(e.target.value)} aria-label={tr("country")}>
                    {countries.map(x => <option key={x[0]} value={x[0]}>{x[2]} {x[0]} {x[1]}</option>)}
                  </select>
                  <input id="nova-phone" inputMode="numeric" autoComplete="tel-national" value={number}
                    onChange={e => setNumber(e.target.value.replace(/[^0-9 ()-]/g,""))} placeholder={tr("numberHint")}/>
                </div>
                <button className="primary full" disabled={busy} type="submit">{busy ? "◌ "+tr("working") : "🚀 "+tr("submit")+" ↗"}</button>
              </form>

              {state !== "idle" && <div className={`result ${state}`} aria-live="polite">
                <div className="resultTop"><p className="eyebrow">{tr("pairing")}</p><span className="resultState">● {statusLabel}</span></div>

                {state === "error" && sessionInfo?.errorCode === "SESSION_ALREADY_INSTALLED" ? <>
                  <h3>🟢 {tr("alreadyInstalledTitle")}</h3>
                  <p>{tr("alreadyInstalled")}</p>
                  {sessionInfo?.jid && <div className="sessionJid" dir="ltr">{sessionInfo.jid}</div>}
                </> : state === "error" && sessionInfo?.errorCode === "SESSION_EXISTS_OFFLINE" ? <>
                  <h3>📡 {tr("existingSessionTitle")}</h3><p>{tr("existingSession")}</p>
                  {sessionInfo?.jid && <div className="sessionJid" dir="ltr">{sessionInfo.jid}</div>}
                </> : state === "error" && sessionInfo?.errorCode === "SESSION_ALREADY_CONNECTING" ? <>
                  <h3>⏳ {tr("alreadyConnectingTitle")}</h3><p>{tr("alreadyConnecting")}</p>
                </> : <>
                  {code && <><div className="pairCode" dir="ltr">{code}</div><button className="secondary copy" onClick={copy} type="button">{copied?<Check size={17}/>:<Copy size={17}/>} {copied?tr("copied"):tr("copy")}</button></>}
                  {state === "online" && <h3 className="onlineText">🟢 {tr("online")}</h3>}
                  {state === "pairing" && <p className="resultHint">📡 {code ? tr("realCodeHint") : tr("waitingCode")}</p>}
                  {state === "connecting" && <p className="resultHint">📡 {tr("waitingState")}</p>}
                  {state === "error" && <><h3>{tr("errorTitle")}</h3><p>{message || tr("errorText")}</p></>}
                </>}

                <div className="instructionsBox"><ShieldCheck size={18}/><p>{tr("instructions")}</p></div>
              </div>}
            </div>
          </div>
          <div className="belowActions"><button className="textlink" onClick={() => go("guide")}>🧭 {tr("guide")} ↗</button><button className="textlink" onClick={() => go("status")}>📊 {tr("status")} ↗</button></div>
        </section>}

        {page === "guide" && <section className="pageSection">
          <div className="sectionHeader"><div><p className="eyebrow">NOVA / GUIDE</p><h1>{tr("guideTitle")}</h1><p className="lead">{tr("guideLead")}</p></div><div className="headerOrb">🪐</div></div>
          <div className="guideGrid">{["step1","step2","step3","step4","step5"].map((step,i)=><article className="guideStep" key={step}><b>0{i+1}</b><span>{["📱","🚀","🔐","📡","🟢"][i]}</span><p>{tr(step)}</p></article>)}</div>
          <div className="guideNote"><ShieldCheck/><div><strong>{tr("realCodeLabel")}</strong><p>{tr("instructions")}</p></div></div>
          <div className="tutorial"><div><p className="eyebrow">{tr("tutorialLabel")}</p><p>{tr("tutorialText")}</p></div><a className="primary" href={VIDEO} target="_blank" rel="noreferrer">🎵 {tr("tutorial")} ↗</a></div>
        </section>}

        {page === "status" && <section className="pageSection">
          <p className="eyebrow">NOVA / SYSTEM STATUS</p><h1>{tr("status")}</h1><p className="lead">{tr("statusLead")}</p>
          <div className="statusGrid">
            <article><Globe/><small>{tr("website")}</small><h2 className="onlineText">● {tr("online")}</h2></article>
            <article><Activity/><small>{tr("health")}</small><h2 className={health ? "onlineText":"offlineText"}>{health===null?"◌":health?tr("serverUp"):tr("serverDown")}</h2><button className="secondary" onClick={refreshHealth}>{tr("check")}</button></article>
            <article><Radio/><small>WhatsApp</small><h2 className={state==="online"?"onlineText":state==="error"?"offlineText":"waitingText"}>{statusLabel}</h2><p>{sessionInfo?.jid || tr("statusUnavailable")}</p></article>
          </div>
        </section>}

        {page === "telegram" && <section className="pageSection"><p className="eyebrow">SUNG BOT / TELEGRAM</p><h1>{tr("telegram")}</h1><p className="lead">{tr("telegramExplain")}</p><div className="contactGrid">{links.slice(0,4).map(([key,url])=><a className="contactCard" href={url} target="_blank" rel="noreferrer" key={key}><ArrowUpRight/><span className="cardIcon">✦</span><h3>{tr(key)}</h3><span>{url || "Coming soon..."}</span></a>)}</div>{VIDEO && <a className="primary" href={VIDEO} target="_blank" rel="noreferrer">🎬 {tr("tutorial")} ↗</a>}</section>}

        {page === "about" && <section className="pageSection"><p className="eyebrow">SUNG BOT / ORIGIN</p><h1>{tr("about")}</h1><p className="lead">{tr("aboutText")}</p><div className="aboutLayout"><div className="aboutOrb"><img src={IMG} alt="SUNG BOT emblem"/></div><div className="aboutPanel"><span>🎵 SUNG BOT</span><strong>Made by GEO</strong><p>{tr("aboutSignal")}</p></div></div></section>}

        {page === "contact" && <section className="pageSection"><p className="eyebrow">SUNG BOT / COMMUNITY</p><h1>{tr("contact")}</h1><p className="lead">{tr("contactText")}</p><div className="contactGrid">{links.map(([key,url])=><a className="contactCard" href={url || "#"} target={url ? "_blank" : "self"} rel="noreferrer" key={key}><ArrowUpRight/><span className="cardIcon">📡</span><h3>{tr(key)}</h3><span>{url || "Coming soon..."}</span></a>)}</div></section>}
      </main>

      <footer><div className="footerBrand"><b>✦ SUNG BOT</b><span>سونج 🎵</span></div><span>{tr("footer")} · {tr("powered")}</span><a href="https://t.me/yourusername" target="_blank" rel="noreferrer">@YourUsername ↗</a></footer>

      <div className="music"><audio ref={audioRef} src={AUDIO} loop autoPlay preload="auto" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}/><button onClick={()=>{const a=audioRef.current;if(!a)return;if(a.paused)a.play().then(()=>setPlaying(true)).catch(()=>{});else a.pause();}}>{playing?<Pause size={17}/>:<Play size={17}/>}<Music2 size={17}/></button><span className="musicLabel"><span>●</span> SUNG SOUND</span></div>
      <button className="helpFloat" onClick={()=>go("guide")} aria-label={tr("guide")}><CircleHelp size={19}/></button>
    </div>
  );
}