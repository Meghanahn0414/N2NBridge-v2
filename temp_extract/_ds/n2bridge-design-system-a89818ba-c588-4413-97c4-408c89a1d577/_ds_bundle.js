/* @ds-bundle: {"format":3,"namespace":"N2BridgeDesignSystem_a89818","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"CardHeader","sourcePath":"components/core/Card.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Stat","sourcePath":"components/data/Stat.jsx"},{"name":"Timeline","sourcePath":"components/data/Timeline.jsx"},{"name":"Banner","sourcePath":"components/feedback/Banner.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"SegmentedControl","sourcePath":"components/navigation/SegmentedControl.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"d48f0a352ba3","components/core/Badge.jsx":"1506709a172f","components/core/Button.jsx":"e60aab807e0f","components/core/Card.jsx":"346e22b56a62","components/core/Icon.jsx":"0b4a7e109dff","components/core/IconButton.jsx":"95b450de92e6","components/data/Stat.jsx":"cc0b7a507f78","components/data/Timeline.jsx":"c53c2fe19a24","components/feedback/Banner.jsx":"1c4647e484f5","components/feedback/Dialog.jsx":"97e6c0076258","components/feedback/Toast.jsx":"ea4116e75fd6","components/feedback/Tooltip.jsx":"f3556a6a99e8","components/forms/Checkbox.jsx":"917e0cd77aa2","components/forms/Field.jsx":"7f33c3a9f8bf","components/forms/Input.jsx":"47bf8c7867ea","components/forms/Radio.jsx":"2f053fce88c7","components/forms/Select.jsx":"23cafb849d0d","components/forms/Switch.jsx":"3eb60c08aead","components/forms/Textarea.jsx":"dc5951b92d38","components/navigation/SegmentedControl.jsx":"e69737117c32","components/navigation/Tabs.jsx":"72be709df097","ui_kits/_shared/kit.jsx":"9b73234155e3","ui_kits/citizen-app/app.jsx":"e8c3fe06a1b2","ui_kits/notifications/app.jsx":"d5fb8a8b3a2f","ui_kits/rep-dashboard/app.jsx":"ae3b82dd0a65","ui_kits/rep-dashboard/data.js":"8074aafff9fa"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.N2BridgeDesignSystem_a89818 = window.N2BridgeDesignSystem_a89818 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 52,
  xl: 72
};
const FONT = {
  xs: 10,
  sm: 12,
  md: 15,
  lg: 19,
  xl: 26
};

// Deterministic warm/cool tint from a name
const PALETTE = [['var(--blue-100)', 'var(--blue-700)'], ['var(--clay-100)', 'var(--clay-700)'], ['var(--green-100)', 'var(--green-600)'], ['var(--info-bg)', 'var(--blue-600)'], ['var(--warning-bg)', 'var(--amber-600)']];
function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}
function tint(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = h * 31 + name.charCodeAt(i) >>> 0;
  return PALETTE[h % PALETTE.length];
}
const STATUS = {
  online: 'var(--green-500)',
  away: 'var(--amber-500)',
  offline: 'var(--neutral-400)'
};

/**
 * User / constituent avatar with initials fallback and optional status dot.
 */
function Avatar({
  name = '',
  src,
  size = 'md',
  status,
  style,
  ...rest
}) {
  const dim = SIZES[size] || SIZES.md;
  const [bg, fg] = tint(name);
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: 'relative',
      display: 'inline-flex',
      width: dim,
      height: dim,
      flexShrink: 0,
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      objectFit: 'cover',
      display: 'block'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      background: bg,
      color: fg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
      fontWeight: 600,
      fontSize: FONT[size] || FONT.md,
      letterSpacing: '0.01em'
    }
  }, initials(name)), status && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: -1,
      bottom: -1,
      width: Math.max(8, dim * 0.26),
      height: Math.max(8, dim * 0.26),
      borderRadius: '50%',
      background: STATUS[status] || STATUS.offline,
      border: '2px solid var(--bg-surface)'
    }
  }));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  neutral: {
    bg: 'var(--neutral-100)',
    fg: 'var(--neutral-700)',
    dot: 'var(--neutral-500)'
  },
  info: {
    bg: 'var(--info-bg)',
    fg: 'var(--blue-700)',
    dot: 'var(--status-new)'
  },
  progress: {
    bg: 'var(--warning-bg)',
    fg: 'var(--amber-600)',
    dot: 'var(--status-progress)'
  },
  success: {
    bg: 'var(--success-bg)',
    fg: 'var(--green-600)',
    dot: 'var(--status-resolved)'
  },
  danger: {
    bg: 'var(--danger-bg)',
    fg: 'var(--red-600)',
    dot: 'var(--status-urgent)'
  },
  brand: {
    bg: 'var(--blue-100)',
    fg: 'var(--blue-700)',
    dot: 'var(--blue-500)'
  },
  accent: {
    bg: 'var(--clay-100)',
    fg: 'var(--clay-700)',
    dot: 'var(--clay-500)'
  }
};

/**
 * Compact status / category badge.
 */
function Badge({
  children,
  tone = 'neutral',
  dot = false,
  size = 'md',
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.neutral;
  const dims = size === 'sm' ? {
    padding: dot ? '2px 9px 2px 7px' : '2px 9px',
    fontSize: '11px',
    gap: '5px'
  } : {
    padding: dot ? '4px 11px 4px 9px' : '4px 11px',
    fontSize: '12.5px',
    gap: '6px'
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: dims.gap,
      padding: dims.padding,
      borderRadius: 'var(--radius-pill)',
      background: t.bg,
      color: t.fg,
      fontSize: dims.fontSize,
      fontWeight: 600,
      fontFamily: 'var(--font-sans)',
      lineHeight: 1.4,
      letterSpacing: '0.005em',
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: t.dot,
      flexShrink: 0
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    height: 'var(--control-sm)',
    padding: '0 12px',
    fontSize: 'var(--text-sm)',
    gap: '6px',
    radius: 'var(--radius-sm)'
  },
  md: {
    height: 'var(--control-md)',
    padding: '0 16px',
    fontSize: 'var(--text-base)',
    gap: '8px',
    radius: 'var(--radius-md)'
  },
  lg: {
    height: 'var(--control-lg)',
    padding: '0 22px',
    fontSize: 'var(--text-md)',
    gap: '9px',
    radius: 'var(--radius-md)'
  }
};
const VARIANTS = {
  primary: {
    background: 'var(--brand-action)',
    color: 'var(--text-on-brand)',
    border: '1px solid transparent',
    shadow: 'var(--shadow-xs)'
  },
  secondary: {
    background: 'var(--bg-surface)',
    color: 'var(--brand-primary)',
    border: '1px solid var(--border-strong)',
    shadow: 'var(--shadow-xs)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--brand-primary)',
    border: '1px solid transparent',
    shadow: 'none'
  },
  accent: {
    background: 'var(--accent-warm)',
    color: 'var(--text-on-accent)',
    border: '1px solid transparent',
    shadow: 'var(--shadow-xs)'
  },
  danger: {
    background: 'var(--danger-fg)',
    color: '#fff',
    border: '1px solid transparent',
    shadow: 'var(--shadow-xs)'
  }
};

/**
 * N2Bridge primary action button.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  leadingIcon = null,
  trailingIcon = null,
  type = 'button',
  onClick,
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const isDisabled = disabled || loading;
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.gap,
    height: s.height,
    padding: s.padding,
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'var(--font-sans)',
    fontSize: s.fontSize,
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: '-0.005em',
    color: v.color,
    background: v.background,
    border: v.border,
    borderRadius: s.radius,
    boxShadow: v.shadow,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.5 : 1,
    transition: 'background var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard), transform var(--dur-instant) var(--ease-standard)',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    ...style
  };
  const hoverBg = {
    primary: 'var(--brand-action-hover)',
    secondary: 'var(--bg-subtle)',
    ghost: 'var(--bg-subtle)',
    accent: 'var(--accent-warm-hover)',
    danger: 'var(--red-600)'
  }[variant];
  const onEnter = e => {
    if (!isDisabled) e.currentTarget.style.background = hoverBg;
  };
  const onLeave = e => {
    if (!isDisabled) e.currentTarget.style.background = v.background;
  };
  const onDown = e => {
    if (!isDisabled) e.currentTarget.style.transform = 'translateY(1px)';
  };
  const onUp = e => {
    e.currentTarget.style.transform = 'none';
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: isDisabled,
    onClick: onClick,
    style: base,
    onMouseEnter: onEnter,
    onMouseLeave: e => {
      onLeave(e);
      onUp(e);
    },
    onMouseDown: onDown,
    onMouseUp: onUp
  }, rest), loading && /*#__PURE__*/React.createElement(Spinner, null), !loading && leadingIcon, children && /*#__PURE__*/React.createElement("span", null, children), !loading && trailingIcon);
}
function Spinner() {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: '15px',
      height: '15px',
      borderRadius: '50%',
      border: '2px solid currentColor',
      borderTopColor: 'transparent',
      display: 'inline-block',
      animation: 'n2spin 0.7s linear infinite'
    }
  }, /*#__PURE__*/React.createElement("style", null, '@keyframes n2spin{to{transform:rotate(360deg)}}'));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Surface container — the standard N2Bridge card.
 */
function Card({
  children,
  padding = 'md',
  interactive = false,
  raised = false,
  style,
  onClick,
  ...rest
}) {
  const pad = {
    none: 0,
    sm: 'var(--space-3)',
    md: 'var(--space-5)',
    lg: 'var(--space-6)'
  }[padding] ?? 'var(--space-5)';
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      padding: pad,
      boxShadow: raised ? 'var(--shadow-md)' : 'var(--shadow-xs)',
      transition: 'box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard), transform var(--dur-base) var(--ease-standard)',
      cursor: interactive ? 'pointer' : 'default',
      ...(interactive && hover ? {
        boxShadow: 'var(--shadow-md)',
        borderColor: 'var(--border-strong)',
        transform: 'translateY(-1px)'
      } : null),
      ...style
    }
  }, rest), children);
}

/** Optional structured header for a Card. */
function CardHeader({
  title,
  subtitle,
  action,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 'var(--space-3)',
      marginBottom: 'var(--space-4)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-lg)',
      fontWeight: 600,
      color: 'var(--text-primary)',
      lineHeight: 1.25
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-secondary)',
      marginTop: 2
    }
  }, subtitle)), action);
}
Object.assign(__ds_scope, { Card, CardHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* N2Bridge standardizes on Lucide (outline icons). The component loads the
   Lucide UMD bundle once from CDN and builds each glyph's SVG per-instance so
   size / stroke / color are fully isolated. Icon names are kebab-case
   (e.g. "map-pin", "message-circle"). */

let _lucidePromise = null;
function ensureLucide() {
  if (typeof window !== 'undefined' && window.lucide) return Promise.resolve(window.lucide);
  if (_lucidePromise) return _lucidePromise;
  _lucidePromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js';
    s.async = true;
    s.onload = () => resolve(window.lucide);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return _lucidePromise;
}
function toPascal(name) {
  return String(name).split(/[-_ ]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
}
function buildSvg(node, {
  size,
  strokeWidth,
  color
}) {
  if (!node) return '';
  const children = (node[2] || []).map(([tag, attrs]) => {
    const a = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
    return `<${tag} ${a} />`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${children}</svg>`;
}

/**
 * Render a Lucide outline icon by kebab-case name.
 */
function Icon({
  name = 'circle',
  size = 20,
  strokeWidth = 1.9,
  color = 'currentColor',
  style,
  ...rest
}) {
  const ref = React.useRef(null);
  const [, force] = React.useState(0);
  React.useEffect(() => {
    let active = true;
    ensureLucide().then(lucide => {
      if (!active || !ref.current) return;
      const node = lucide.icons && lucide.icons[toPascal(name)] || null;
      ref.current.innerHTML = buildSvg(node, {
        size,
        strokeWidth,
        color
      });
      if (!node) force(n => n + 1);
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [name, size, strokeWidth, color]);
  return /*#__PURE__*/React.createElement("span", _extends({
    ref: ref,
    "aria-hidden": "true",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      flexShrink: 0,
      lineHeight: 0,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: 32,
  md: 40,
  lg: 48
};
const ICON = {
  sm: 16,
  md: 19,
  lg: 22
};

/**
 * Square icon-only button.
 */
function IconButton({
  icon = 'circle',
  variant = 'ghost',
  size = 'md',
  label,
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const dim = SIZES[size] || SIZES.md;
  const variants = {
    solid: {
      background: 'var(--brand-action)',
      color: '#fff',
      border: '1px solid transparent'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent'
    },
    outline: {
      background: 'var(--bg-surface)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-default)'
    }
  };
  const v = variants[variant] || variants.ghost;
  const hover = {
    solid: 'var(--brand-action-hover)',
    ghost: 'var(--bg-subtle)',
    outline: 'var(--bg-subtle)'
  }[variant];
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: e => {
      if (!disabled) e.currentTarget.style.background = hover;
    },
    onMouseLeave: e => {
      if (!disabled) e.currentTarget.style.background = v.background;
    },
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: dim,
      height: dim,
      borderRadius: 'var(--radius-md)',
      background: v.background,
      color: v.color,
      border: v.border,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transition: 'background var(--dur-fast) var(--ease-standard)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: ICON[size] || ICON.md,
    color: "currentColor"
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data/Stat.jsx
try { (() => {
/**
 * Metric / KPI display for dashboards.
 */
function Stat({
  label,
  value,
  delta,
  deltaDirection,
  icon,
  tone = 'brand',
  style
}) {
  const tones = {
    brand: 'var(--blue-700)',
    accent: 'var(--clay-600)',
    success: 'var(--green-600)',
    danger: 'var(--red-600)',
    neutral: 'var(--text-primary)'
  };
  const up = deltaDirection === 'up';
  const deltaColor = deltaDirection ? up ? 'var(--green-600)' : 'var(--red-600)' : 'var(--text-muted)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      width: 30,
      height: 30,
      borderRadius: 'var(--radius-sm)',
      background: 'var(--blue-100)',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--blue-700)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 17,
    color: "currentColor"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--text-secondary)',
      textTransform: 'none'
    }
  }, label)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-3xl)',
      fontWeight: 600,
      color: tones[tone] || tones.brand,
      lineHeight: 1,
      letterSpacing: '-0.02em'
    }
  }, value), delta != null && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2,
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: deltaColor
    }
  }, deltaDirection && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: up ? 'arrow-up-right' : 'arrow-down-right',
    size: 14,
    color: "currentColor"
  }), delta)));
}
Object.assign(__ds_scope, { Stat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Stat.jsx", error: String((e && e.message) || e) }); }

// components/data/Timeline.jsx
try { (() => {
const TONES = {
  new: 'var(--status-new)',
  progress: 'var(--status-progress)',
  resolved: 'var(--status-resolved)',
  urgent: 'var(--status-urgent)',
  waiting: 'var(--status-waiting)',
  accent: 'var(--clay-500)'
};

/**
 * Vertical case-history timeline.
 * `items`: [{ title, time, description, tone, icon, done }]
 */
function Timeline({
  items = [],
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      ...style
    }
  }, items.map((it, i) => {
    const color = TONES[it.tone] || 'var(--neutral-400)';
    const last = i === items.length - 1;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        gap: 13,
        minHeight: last ? 'auto' : 56
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 28,
        height: 28,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: it.done === false ? 'var(--bg-surface)' : color,
        border: it.done === false ? '2px dashed var(--border-strong)' : 'none',
        color: '#fff'
      }
    }, it.done !== false && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: it.icon || 'check',
      size: 15,
      color: "#fff",
      strokeWidth: 2.6
    })), !last && /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        width: 2,
        background: 'var(--border-default)',
        marginTop: 2,
        marginBottom: 2
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        paddingBottom: last ? 0 : 14,
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-base)',
        fontWeight: 600,
        color: it.done === false ? 'var(--text-muted)' : 'var(--text-primary)'
      }
    }, it.title), it.time && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-muted)',
        flexShrink: 0
      }
    }, it.time)), it.description && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
        marginTop: 2,
        lineHeight: 1.45
      }
    }, it.description)));
  }));
}
Object.assign(__ds_scope, { Timeline });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Timeline.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Banner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  info: {
    bg: 'var(--info-bg)',
    fg: 'var(--blue-700)',
    accent: 'var(--blue-500)',
    icon: 'info'
  },
  success: {
    bg: 'var(--success-bg)',
    fg: 'var(--green-600)',
    accent: 'var(--green-500)',
    icon: 'check-circle'
  },
  warning: {
    bg: 'var(--warning-bg)',
    fg: 'var(--amber-600)',
    accent: 'var(--amber-500)',
    icon: 'alert-triangle'
  },
  danger: {
    bg: 'var(--danger-bg)',
    fg: 'var(--red-600)',
    accent: 'var(--red-500)',
    icon: 'alert-octagon'
  }
};

/**
 * Inline contextual banner / alert.
 */
function Banner({
  tone = 'info',
  title,
  children,
  icon,
  onDismiss,
  action,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.info;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: 'flex',
      gap: 12,
      padding: '13px 15px',
      borderRadius: 'var(--radius-md)',
      background: t.bg,
      border: `1px solid color-mix(in srgb, ${t.accent} 22%, transparent)`,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      marginTop: 1,
      color: t.accent,
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon || t.icon,
    size: 20,
    color: "currentColor"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-base)',
      fontWeight: 600,
      color: t.fg,
      lineHeight: 1.35
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-secondary)',
      marginTop: title ? 3 : 0,
      lineHeight: 1.45
    }
  }, children), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, action)), onDismiss && /*#__PURE__*/React.createElement("button", {
    onClick: onDismiss,
    "aria-label": "Dismiss",
    style: {
      flexShrink: 0,
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: t.fg,
      opacity: 0.7,
      display: 'flex',
      padding: 2
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 18,
    color: "currentColor"
  })));
}
Object.assign(__ds_scope, { Banner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Banner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
/**
 * Centered modal dialog with overlay.
 */
function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 480,
  style
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 'var(--z-modal)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface-overlay)',
      backdropFilter: 'blur(2px)',
      padding: 'var(--space-4)',
      animation: 'n2fade var(--dur-base) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("style", null, '@keyframes n2fade{from{opacity:0}to{opacity:1}}@keyframes n2pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}'), /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation(),
    style: {
      width,
      maxWidth: '100%',
      maxHeight: '90vh',
      overflow: 'auto',
      background: 'var(--bg-surface)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-xl)',
      animation: 'n2pop var(--dur-base) var(--ease-emphasized)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
      padding: '20px 22px 0'
    }
  }, /*#__PURE__*/React.createElement("div", null, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-xl)',
      fontWeight: 600,
      color: 'var(--text-primary)',
      lineHeight: 1.2
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-secondary)',
      marginTop: 5,
      lineHeight: 1.45
    }
  }, description)), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close",
    style: {
      border: 'none',
      background: 'var(--bg-sunken)',
      borderRadius: 'var(--radius-sm)',
      width: 30,
      height: 30,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: 'var(--text-secondary)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 17,
    color: "currentColor"
  }))), children && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 22px 4px',
      fontSize: 'var(--text-base)',
      color: 'var(--text-secondary)',
      lineHeight: 1.55
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      padding: '16px 22px 22px'
    }
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  info: {
    accent: 'var(--blue-500)',
    icon: 'info'
  },
  success: {
    accent: 'var(--green-500)',
    icon: 'check-circle'
  },
  warning: {
    accent: 'var(--amber-500)',
    icon: 'alert-triangle'
  },
  danger: {
    accent: 'var(--red-500)',
    icon: 'alert-octagon'
  },
  message: {
    accent: 'var(--clay-500)',
    icon: 'message-circle'
  }
};

/**
 * Floating toast notification — the visual unit of the N2Bridge real-time system.
 */
function Toast({
  tone = 'info',
  title,
  children,
  icon,
  avatar,
  timestamp,
  onDismiss,
  action,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.info;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      position: 'relative',
      display: 'flex',
      gap: 12,
      width: 380,
      maxWidth: '100%',
      padding: '14px 14px 14px 16px',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      overflow: 'hidden',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      background: t.accent
    }
  }), avatar ? /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0
    }
  }, avatar) : /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      marginTop: 1,
      color: t.accent,
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon || t.icon,
    size: 22,
    color: "currentColor"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 8
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-base)',
      fontWeight: 600,
      color: 'var(--text-primary)',
      lineHeight: 1.3
    }
  }, title), timestamp && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      color: 'var(--text-muted)',
      flexShrink: 0
    }
  }, timestamp)), children && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-secondary)',
      marginTop: 3,
      lineHeight: 1.45
    }
  }, children), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: 'flex',
      gap: 8
    }
  }, action)), onDismiss && /*#__PURE__*/React.createElement("button", {
    onClick: onDismiss,
    "aria-label": "Dismiss",
    style: {
      flexShrink: 0,
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      display: 'flex',
      padding: 2,
      height: 'fit-content'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 16,
    color: "currentColor"
  })));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
/**
 * Lightweight hover/focus tooltip. Wraps a single trigger child.
 */
function Tooltip({
  content,
  placement = 'top',
  children,
  style
}) {
  const [open, setOpen] = React.useState(false);
  const pos = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%) translateY(-8px)'
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%) translateY(8px)'
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%) translateX(-8px)'
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%) translateX(8px)'
    }
  }[placement];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex'
    },
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false)
  }, children, open && /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: 'absolute',
      zIndex: 'var(--z-tooltip)',
      ...pos,
      background: 'var(--blue-900)',
      color: '#fff',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-xs)',
      fontWeight: 500,
      lineHeight: 1.4,
      padding: '6px 9px',
      borderRadius: 'var(--radius-sm)',
      whiteSpace: 'nowrap',
      boxShadow: 'var(--shadow-md)',
      pointerEvents: 'none',
      ...style
    }
  }, content));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Checkbox with label. Controlled via `checked` or uncontrolled via `defaultChecked`.
 */
function Checkbox({
  label,
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  description,
  style,
  ...rest
}) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(defaultChecked || false);
  const on = isControlled ? checked : internal;
  const toggle = e => {
    if (disabled) return;
    if (!isControlled) setInternal(!on);
    onChange?.(!on, e);
  };
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: description ? 'flex-start' : 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: toggle,
    style: {
      width: 20,
      height: 20,
      flexShrink: 0,
      marginTop: description ? 1 : 0,
      borderRadius: 'var(--radius-sm)',
      border: on ? '1px solid var(--brand-action)' : '1px solid var(--border-strong)',
      background: on ? 'var(--brand-action)' : 'var(--bg-surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)'
    }
  }, on && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 14,
    color: "#fff",
    strokeWidth: 3
  })), (label || description) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-base)',
      color: 'var(--text-primary)',
      lineHeight: 1.35
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)',
      lineHeight: 1.4
    }
  }, description)), /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    checked: on,
    disabled: disabled,
    onChange: () => {},
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }, rest)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
/** Field shell — label, optional hint, error message, required marker. */
function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--danger-fg)',
      marginLeft: 3
    }
  }, "*")), children, error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--danger-fg)',
      fontWeight: 500
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    height: 'var(--control-sm)',
    font: 'var(--text-sm)',
    pad: 10
  },
  md: {
    height: 'var(--control-md)',
    font: 'var(--text-base)',
    pad: 12
  },
  lg: {
    height: 'var(--control-lg)',
    font: 'var(--text-md)',
    pad: 14
  }
};

/**
 * Single-line text input with optional leading/trailing icon.
 */
function Input({
  size = 'md',
  leadingIcon,
  trailingIcon,
  invalid = false,
  disabled = false,
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const [focus, setFocus] = React.useState(false);
  const borderColor = invalid ? 'var(--danger-fg)' : focus ? 'var(--border-brand)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: s.height,
      padding: `0 ${s.pad}px`,
      background: disabled ? 'var(--bg-sunken)' : 'var(--bg-surface)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: focus ? 'var(--shadow-focus)' : 'var(--shadow-xs)',
      transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
      opacity: disabled ? 0.6 : 1,
      ...style
    }
  }, leadingIcon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: leadingIcon,
    size: 18,
    color: "var(--text-muted)"
  }), /*#__PURE__*/React.createElement("input", _extends({
    disabled: disabled,
    onFocus: e => {
      setFocus(true);
      rest.onFocus?.(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur?.(e);
    }
  }, rest, {
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-sans)',
      fontSize: s.font,
      color: 'var(--text-primary)'
    }
  })), trailingIcon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: trailingIcon,
    size: 18,
    color: "var(--text-muted)"
  }));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Radio option. Group several with the same `name` and one selected `value`.
 */
function Radio({
  label,
  description,
  checked,
  disabled = false,
  value,
  name,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: description ? 'flex-start' : 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => !disabled && onChange?.(value),
    style: {
      width: 20,
      height: 20,
      flexShrink: 0,
      marginTop: description ? 1 : 0,
      borderRadius: '50%',
      border: checked ? '6px solid var(--brand-action)' : '1px solid var(--border-strong)',
      background: 'var(--bg-surface)',
      transition: 'border-color var(--dur-fast) var(--ease-standard), border-width var(--dur-fast) var(--ease-standard)'
    }
  }), (label || description) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-base)',
      color: 'var(--text-primary)',
      lineHeight: 1.35
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)',
      lineHeight: 1.4
    }
  }, description)), /*#__PURE__*/React.createElement("input", _extends({
    type: "radio",
    name: name,
    value: value,
    checked: checked,
    disabled: disabled,
    onChange: () => {},
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }, rest)));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    height: 'var(--control-sm)',
    font: 'var(--text-sm)'
  },
  md: {
    height: 'var(--control-md)',
    font: 'var(--text-base)'
  },
  lg: {
    height: 'var(--control-lg)',
    font: 'var(--text-md)'
  }
};

/**
 * Native select with N2Bridge styling and a custom chevron.
 */
function Select({
  size = 'md',
  invalid = false,
  disabled = false,
  children,
  placeholder,
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const [focus, setFocus] = React.useState(false);
  const borderColor = invalid ? 'var(--danger-fg)' : focus ? 'var(--border-brand)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      height: s.height,
      background: disabled ? 'var(--bg-sunken)' : 'var(--bg-surface)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: focus ? 'var(--shadow-focus)' : 'var(--shadow-xs)',
      transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
      opacity: disabled ? 0.6 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false)
  }, rest, {
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      flex: 1,
      height: '100%',
      padding: '0 36px 0 12px',
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-sans)',
      fontSize: s.font,
      color: 'var(--text-primary)',
      cursor: disabled ? 'not-allowed' : 'pointer'
    }
  }), placeholder && /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true,
    hidden: true
  }, placeholder), children), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 11,
      pointerEvents: 'none',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 18,
    color: "var(--text-muted)"
  })));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * On/off toggle switch.
 */
function Switch({
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  label,
  size = 'md',
  style,
  ...rest
}) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(defaultChecked || false);
  const on = isControlled ? checked : internal;
  const dims = size === 'sm' ? {
    w: 36,
    h: 20,
    k: 14
  } : {
    w: 44,
    h: 24,
    k: 18
  };
  const toggle = e => {
    if (disabled) return;
    if (!isControlled) setInternal(!on);
    onChange?.(!on, e);
  };
  const sw = /*#__PURE__*/React.createElement("span", {
    onClick: toggle,
    style: {
      position: 'relative',
      width: dims.w,
      height: dims.h,
      flexShrink: 0,
      borderRadius: 'var(--radius-pill)',
      background: on ? 'var(--brand-action)' : 'var(--neutral-300)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background var(--dur-base) var(--ease-standard)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: (dims.h - dims.k) / 2,
      left: on ? dims.w - dims.k - (dims.h - dims.k) / 2 : (dims.h - dims.k) / 2,
      width: dims.k,
      height: dims.k,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: 'var(--shadow-sm)',
      transition: 'left var(--dur-base) var(--ease-emphasized)'
    }
  }));
  if (!label) return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      opacity: disabled ? 0.55 : 1,
      ...style
    }
  }, rest), sw);
  return /*#__PURE__*/React.createElement("label", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1,
      ...style
    }
  }, rest), sw, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-base)',
      color: 'var(--text-primary)'
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Multi-line text input.
 */
function Textarea({
  invalid = false,
  disabled = false,
  rows = 4,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const borderColor = invalid ? 'var(--danger-fg)' : focus ? 'var(--border-brand)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("textarea", _extends({
    rows: rows,
    disabled: disabled,
    onFocus: e => {
      setFocus(true);
      rest.onFocus?.(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur?.(e);
    }
  }, rest, {
    style: {
      width: '100%',
      padding: '10px 12px',
      resize: 'vertical',
      background: disabled ? 'var(--bg-sunken)' : 'var(--bg-surface)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: focus ? 'var(--shadow-focus)' : 'var(--shadow-xs)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-base)',
      lineHeight: 1.5,
      color: 'var(--text-primary)',
      outline: 'none',
      transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
      opacity: disabled ? 0.6 : 1,
      ...style
    }
  }));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SegmentedControl.jsx
try { (() => {
/**
 * iOS-style segmented control for mobile surfaces.
 * `options`: [{ value, label }] or string[]
 */
function SegmentedControl({
  options = [],
  value,
  onChange,
  size = 'md',
  style
}) {
  const opts = options.map(o => typeof o === 'string' ? {
    value: o,
    label: o
  } : o);
  const h = size === 'sm' ? 32 : 40;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      padding: 3,
      background: 'var(--bg-sunken)',
      borderRadius: 'var(--radius-md)',
      gap: 2,
      ...style
    }
  }, opts.map(o => {
    const active = o.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: o.value,
      onClick: () => onChange?.(o.value),
      style: {
        flex: 1,
        height: h - 6,
        padding: '0 16px',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        background: active ? 'var(--bg-surface)' : 'transparent',
        boxShadow: active ? 'var(--shadow-xs)' : 'none',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        fontWeight: active ? 600 : 500,
        color: active ? 'var(--brand-primary)' : 'var(--text-secondary)',
        whiteSpace: 'nowrap',
        transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)'
      }
    }, o.label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
/**
 * Underline tab bar. Controlled via `value`/`onChange`.
 * `items`: [{ value, label, count }]
 */
function Tabs({
  items = [],
  value,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'flex',
      gap: 4,
      borderBottom: '1px solid var(--border-default)',
      ...style
    }
  }, items.map(it => {
    const active = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      role: "tab",
      "aria-selected": active,
      onClick: () => onChange?.(it.value),
      style: {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '10px 12px 12px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-base)',
        fontWeight: active ? 600 : 500,
        color: active ? 'var(--brand-primary)' : 'var(--text-secondary)',
        transition: 'color var(--dur-fast) var(--ease-standard)'
      },
      onMouseEnter: e => {
        if (!active) e.currentTarget.style.color = 'var(--text-primary)';
      },
      onMouseLeave: e => {
        if (!active) e.currentTarget.style.color = 'var(--text-secondary)';
      }
    }, it.label, it.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        minWidth: 18,
        height: 18,
        padding: '0 5px',
        borderRadius: 'var(--radius-pill)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? 'var(--blue-100)' : 'var(--neutral-100)',
        color: active ? 'var(--blue-700)' : 'var(--text-muted)'
      }
    }, it.count), active && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 6,
        right: 6,
        bottom: -1,
        height: 2.5,
        borderRadius: '2px 2px 0 0',
        background: 'var(--brand-action)'
      }
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/_shared/kit.jsx
try { (() => {
/* ============================================================
   N2Bridge UI-kit preview primitives.
   These mirror the compiled design-system components 1:1 (same
   names + props) but are token-styled inline so the kits render
   standalone in any browser. In production, consuming projects
   use window.N2BridgeDesignSystem_* from _ds_bundle.js instead.
   ============================================================ */
const {
  useState,
  useEffect,
  useRef
} = React;

/* ---- Icon (Lucide) ---- */
let _lucideReady = !!window.lucide;
function Icon({
  name = 'circle',
  size = 20,
  strokeWidth = 1.9,
  color = 'currentColor',
  style
}) {
  const ref = useRef(null);
  useEffect(() => {
    function paint() {
      if (!ref.current || !window.lucide) return;
      const toP = n => n.split(/[-_ ]/).map(p => p[0].toUpperCase() + p.slice(1)).join('');
      const node = window.lucide.icons && window.lucide.icons[toP(name)];
      if (!node) return;
      const kids = (node[2] || []).map(([t, a]) => '<' + t + ' ' + Object.entries(a).map(([k, v]) => k + '="' + v + '"').join(' ') + ' />').join('');
      ref.current.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + strokeWidth + '" stroke-linecap="round" stroke-linejoin="round">' + kids + '</svg>';
    }
    if (window.lucide) paint();else {
      const iv = setInterval(() => {
        if (window.lucide) {
          clearInterval(iv);
          paint();
        }
      }, 60);
      return () => clearInterval(iv);
    }
  }, [name, size, strokeWidth, color]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    "aria-hidden": "true",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      flexShrink: 0,
      lineHeight: 0,
      ...style
    }
  });
}

/* ---- Button ---- */
const BTN_SIZE = {
  sm: {
    height: 32,
    padding: '0 12px',
    fontSize: 13
  },
  md: {
    height: 40,
    padding: '0 16px',
    fontSize: 15
  },
  lg: {
    height: 48,
    padding: '0 22px',
    fontSize: 16
  }
};
const BTN_VAR = {
  primary: {
    background: 'var(--brand-action)',
    color: '#fff',
    border: '1px solid transparent'
  },
  secondary: {
    background: 'var(--bg-surface)',
    color: 'var(--brand-primary)',
    border: '1px solid var(--border-strong)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--brand-primary)',
    border: '1px solid transparent'
  },
  accent: {
    background: 'var(--accent-warm)',
    color: '#fff',
    border: '1px solid transparent'
  },
  danger: {
    background: 'var(--danger-fg)',
    color: '#fff',
    border: '1px solid transparent'
  }
};
function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth,
  disabled,
  leadingIcon,
  trailingIcon,
  onClick,
  style
}) {
  const s = BTN_SIZE[size],
    v = BTN_VAR[variant];
  const hov = {
    primary: 'var(--brand-action-hover)',
    secondary: 'var(--bg-subtle)',
    ghost: 'var(--bg-subtle)',
    accent: 'var(--accent-warm-hover)',
    danger: 'var(--red-600)'
  }[variant];
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    disabled: disabled,
    onMouseEnter: e => {
      if (!disabled) e.currentTarget.style.background = hov;
    },
    onMouseLeave: e => {
      if (!disabled) e.currentTarget.style.background = v.background;
    },
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: s.height,
      padding: s.padding,
      width: fullWidth ? '100%' : 'auto',
      fontFamily: 'var(--font-sans)',
      fontSize: s.fontSize,
      fontWeight: 600,
      ...v,
      borderRadius: 'var(--radius-md)',
      boxShadow: variant === 'ghost' ? 'none' : 'var(--shadow-xs)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      whiteSpace: 'nowrap',
      transition: 'background var(--dur-fast) var(--ease-standard)',
      ...style
    }
  }, leadingIcon && /*#__PURE__*/React.createElement(Icon, {
    name: leadingIcon,
    size: size === 'sm' ? 15 : 17,
    color: "currentColor"
  }), children && /*#__PURE__*/React.createElement("span", null, children), trailingIcon && /*#__PURE__*/React.createElement(Icon, {
    name: trailingIcon,
    size: size === 'sm' ? 15 : 17,
    color: "currentColor"
  }));
}
function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  label,
  onClick,
  style
}) {
  const dim = {
    sm: 32,
    md: 40,
    lg: 48
  }[size];
  const v = {
    solid: {
      background: 'var(--brand-action)',
      color: '#fff',
      border: '1px solid transparent'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent'
    },
    outline: {
      background: 'var(--bg-surface)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-default)'
    }
  }[variant];
  const hov = {
    solid: 'var(--brand-action-hover)',
    ghost: 'var(--bg-subtle)',
    outline: 'var(--bg-subtle)'
  }[variant];
  return /*#__PURE__*/React.createElement("button", {
    "aria-label": label,
    title: label,
    onClick: onClick,
    onMouseEnter: e => e.currentTarget.style.background = hov,
    onMouseLeave: e => e.currentTarget.style.background = v.background,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: dim,
      height: dim,
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      transition: 'background var(--dur-fast)',
      ...v,
      ...style
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: {
      sm: 16,
      md: 19,
      lg: 22
    }[size],
    color: "currentColor"
  }));
}

/* ---- Badge ---- */
const BADGE_TONE = {
  neutral: ['var(--neutral-100)', 'var(--neutral-700)', 'var(--neutral-500)'],
  info: ['var(--info-bg)', 'var(--blue-700)', 'var(--status-new)'],
  progress: ['var(--warning-bg)', 'var(--amber-600)', 'var(--status-progress)'],
  success: ['var(--success-bg)', 'var(--green-600)', 'var(--status-resolved)'],
  danger: ['var(--danger-bg)', 'var(--red-600)', 'var(--status-urgent)'],
  brand: ['var(--blue-100)', 'var(--blue-700)', 'var(--blue-500)'],
  accent: ['var(--clay-100)', 'var(--clay-700)', 'var(--clay-500)']
};
function Badge({
  children,
  tone = 'neutral',
  dot,
  size = 'md',
  style
}) {
  const [bg, fg, d] = BADGE_TONE[tone];
  const sm = size === 'sm';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: sm ? '2px 9px' : '4px 11px',
      borderRadius: 'var(--radius-pill)',
      background: bg,
      color: fg,
      fontSize: sm ? 11 : 12.5,
      fontWeight: 600,
      fontFamily: 'var(--font-sans)',
      lineHeight: 1.4,
      whiteSpace: 'nowrap',
      ...style
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: d,
      flexShrink: 0
    }
  }), children);
}

/* ---- Avatar ---- */
const AV_SIZE = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 52,
    xl: 72
  },
  AV_FONT = {
    xs: 10,
    sm: 12,
    md: 15,
    lg: 19,
    xl: 26
  };
const AV_PAL = [['var(--blue-100)', 'var(--blue-700)'], ['var(--clay-100)', 'var(--clay-700)'], ['var(--green-100)', 'var(--green-600)'], ['var(--info-bg)', 'var(--blue-600)'], ['var(--warning-bg)', 'var(--amber-600)']];
function Avatar({
  name = '',
  src,
  size = 'md',
  status,
  style
}) {
  const dim = AV_SIZE[size];
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const ini = parts.length ? (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase() : '?';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = h * 31 + name.charCodeAt(i) >>> 0;
  const [bg, fg] = AV_PAL[h % AV_PAL.length];
  const ST = {
    online: 'var(--green-500)',
    away: 'var(--amber-500)',
    offline: 'var(--neutral-400)'
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex',
      width: dim,
      height: dim,
      flexShrink: 0,
      ...style
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      objectFit: 'cover'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      background: bg,
      color: fg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
      fontWeight: 600,
      fontSize: AV_FONT[size]
    }
  }, ini), status && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: -1,
      bottom: -1,
      width: Math.max(8, dim * 0.26),
      height: Math.max(8, dim * 0.26),
      borderRadius: '50%',
      background: ST[status],
      border: '2px solid var(--bg-surface)'
    }
  }));
}

/* ---- Card ---- */
function Card({
  children,
  padding = 'md',
  interactive,
  raised,
  onClick,
  style
}) {
  const pad = {
    none: 0,
    sm: 12,
    md: 20,
    lg: 24
  }[padding];
  const [h, setH] = useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      padding: pad,
      boxShadow: raised ? 'var(--shadow-md)' : 'var(--shadow-xs)',
      cursor: interactive ? 'pointer' : 'default',
      transition: 'box-shadow var(--dur-base), transform var(--dur-base), border-color var(--dur-base)',
      ...(interactive && h ? {
        boxShadow: 'var(--shadow-md)',
        borderColor: 'var(--border-strong)',
        transform: 'translateY(-1px)'
      } : null),
      ...style
    }
  }, children);
}

/* ---- Tabs ---- */
function Tabs({
  items = [],
  value,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      borderBottom: '1px solid var(--border-default)',
      ...style
    }
  }, items.map(it => {
    const a = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      onClick: () => onChange?.(it.value),
      style: {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '10px 12px 12px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        fontWeight: a ? 600 : 500,
        color: a ? 'var(--brand-primary)' : 'var(--text-secondary)'
      }
    }, it.label, it.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        minWidth: 18,
        height: 18,
        padding: '0 5px',
        borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: a ? 'var(--blue-100)' : 'var(--neutral-100)',
        color: a ? 'var(--blue-700)' : 'var(--text-muted)'
      }
    }, it.count), a && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 6,
        right: 6,
        bottom: -1,
        height: 2.5,
        borderRadius: '2px 2px 0 0',
        background: 'var(--brand-action)'
      }
    }));
  }));
}
function SegmentedControl({
  options = [],
  value,
  onChange,
  size = 'md',
  style
}) {
  const opts = options.map(o => typeof o === 'string' ? {
    value: o,
    label: o
  } : o);
  const h = size === 'sm' ? 32 : 40;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      padding: 3,
      background: 'var(--bg-sunken)',
      borderRadius: 'var(--radius-md)',
      gap: 2,
      ...style
    }
  }, opts.map(o => {
    const a = o.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: o.value,
      onClick: () => onChange?.(o.value),
      style: {
        flex: 1,
        height: h - 6,
        padding: '0 16px',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        background: a ? 'var(--bg-surface)' : 'transparent',
        boxShadow: a ? 'var(--shadow-xs)' : 'none',
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: a ? 600 : 500,
        color: a ? 'var(--brand-primary)' : 'var(--text-secondary)',
        whiteSpace: 'nowrap',
        transition: 'all var(--dur-fast)'
      }
    }, o.label);
  }));
}

/* ---- Inputs ---- */
function Input({
  size = 'md',
  leadingIcon,
  trailingIcon,
  invalid,
  value,
  onChange,
  placeholder,
  type,
  style,
  onKeyDown
}) {
  const s = {
    sm: 32,
    md: 40,
    lg: 48
  }[size];
  const [f, setF] = useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: s,
      padding: '0 12px',
      background: 'var(--bg-surface)',
      border: '1px solid ' + (invalid ? 'var(--danger-fg)' : f ? 'var(--border-brand)' : 'var(--border-default)'),
      borderRadius: 'var(--radius-md)',
      boxShadow: f ? 'var(--shadow-focus)' : 'var(--shadow-xs)',
      transition: 'all var(--dur-fast)',
      ...style
    }
  }, leadingIcon && /*#__PURE__*/React.createElement(Icon, {
    name: leadingIcon,
    size: 18,
    color: "var(--text-muted)"
  }), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    type: type,
    onKeyDown: onKeyDown,
    onFocus: () => setF(true),
    onBlur: () => setF(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-sans)',
      fontSize: {
        sm: 13,
        md: 15,
        lg: 16
      }[size],
      color: 'var(--text-primary)'
    }
  }), trailingIcon && /*#__PURE__*/React.createElement(Icon, {
    name: trailingIcon,
    size: 18,
    color: "var(--text-muted)"
  }));
}
function Textarea({
  rows = 4,
  placeholder,
  value,
  onChange,
  style
}) {
  const [f, setF] = useState(false);
  return /*#__PURE__*/React.createElement("textarea", {
    rows: rows,
    placeholder: placeholder,
    value: value,
    onChange: onChange,
    onFocus: () => setF(true),
    onBlur: () => setF(false),
    style: {
      width: '100%',
      padding: '10px 12px',
      resize: 'vertical',
      background: 'var(--bg-surface)',
      border: '1px solid ' + (f ? 'var(--border-brand)' : 'var(--border-default)'),
      borderRadius: 'var(--radius-md)',
      boxShadow: f ? 'var(--shadow-focus)' : 'var(--shadow-xs)',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      lineHeight: 1.5,
      color: 'var(--text-primary)',
      outline: 'none',
      ...style
    }
  });
}
function Field({
  label,
  hint,
  error,
  required,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--danger-fg)',
      marginLeft: 3
    }
  }, "*")), children, error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--danger-fg)',
      fontWeight: 500
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, hint) : null);
}
function Switch({
  checked,
  onChange,
  label,
  size = 'md',
  style
}) {
  const d = size === 'sm' ? {
    w: 36,
    h: 20,
    k: 14
  } : {
    w: 44,
    h: 24,
    k: 18
  };
  const sw = /*#__PURE__*/React.createElement("span", {
    onClick: () => onChange?.(!checked),
    style: {
      position: 'relative',
      width: d.w,
      height: d.h,
      flexShrink: 0,
      borderRadius: 999,
      background: checked ? 'var(--brand-action)' : 'var(--neutral-300)',
      cursor: 'pointer',
      transition: 'background var(--dur-base)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: (d.h - d.k) / 2,
      left: checked ? d.w - d.k - (d.h - d.k) / 2 : (d.h - d.k) / 2,
      width: d.k,
      height: d.k,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: 'var(--shadow-sm)',
      transition: 'left var(--dur-base) var(--ease-emphasized)'
    }
  }));
  if (!label) return /*#__PURE__*/React.createElement("span", {
    style: style
  }, sw);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: 'pointer',
      ...style
    }
  }, sw, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      color: 'var(--text-primary)'
    }
  }, label));
}

/* ---- Toast ---- */
const TOAST_TONE = {
  info: ['var(--blue-500)', 'info'],
  success: ['var(--green-500)', 'check-circle'],
  warning: ['var(--amber-500)', 'alert-triangle'],
  danger: ['var(--red-500)', 'alert-octagon'],
  message: ['var(--clay-500)', 'message-circle']
};
function Toast({
  tone = 'info',
  title,
  children,
  icon,
  avatar,
  timestamp,
  onDismiss,
  action,
  style
}) {
  const [accent, ic] = TOAST_TONE[tone];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      gap: 12,
      width: 380,
      maxWidth: '100%',
      padding: '14px 14px 14px 16px',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      overflow: 'hidden',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      background: accent
    }
  }), avatar ? /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0
    }
  }, avatar) : /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      marginTop: 1,
      color: accent,
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon || ic,
    size: 22,
    color: "currentColor"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 8
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--text-primary)',
      lineHeight: 1.3
    }
  }, title), timestamp && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--text-muted)',
      flexShrink: 0
    }
  }, timestamp)), children && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-secondary)',
      marginTop: 3,
      lineHeight: 1.45
    }
  }, children), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: 'flex',
      gap: 8
    }
  }, action)), onDismiss && /*#__PURE__*/React.createElement("button", {
    onClick: onDismiss,
    "aria-label": "Dismiss",
    style: {
      flexShrink: 0,
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      display: 'flex',
      padding: 2,
      height: 'fit-content'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 16,
    color: "currentColor"
  })));
}

/* ---- Banner ---- */
const BANNER_TONE = {
  info: ['var(--info-bg)', 'var(--blue-700)', 'var(--blue-500)', 'info'],
  success: ['var(--success-bg)', 'var(--green-600)', 'var(--green-500)', 'check-circle'],
  warning: ['var(--warning-bg)', 'var(--amber-600)', 'var(--amber-500)', 'alert-triangle'],
  danger: ['var(--danger-bg)', 'var(--red-600)', 'var(--red-500)', 'alert-octagon']
};
function Banner({
  tone = 'info',
  title,
  children,
  icon,
  onDismiss,
  action,
  style
}) {
  const [bg, fg, accent, ic] = BANNER_TONE[tone];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      padding: '13px 15px',
      borderRadius: 'var(--radius-md)',
      background: bg,
      border: '1px solid color-mix(in srgb, ' + accent + ' 22%, transparent)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      marginTop: 1,
      color: accent,
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon || ic,
    size: 20,
    color: "currentColor"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      fontWeight: 600,
      color: fg,
      lineHeight: 1.35
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-secondary)',
      marginTop: title ? 3 : 0,
      lineHeight: 1.45
    }
  }, children), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, action)), onDismiss && /*#__PURE__*/React.createElement("button", {
    onClick: onDismiss,
    "aria-label": "Dismiss",
    style: {
      flexShrink: 0,
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: fg,
      opacity: 0.7,
      display: 'flex',
      padding: 2
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 18,
    color: "currentColor"
  })));
}

/* ---- Stat ---- */
function Stat({
  label,
  value,
  delta,
  deltaDirection,
  icon,
  tone = 'brand',
  style
}) {
  const tones = {
    brand: 'var(--blue-700)',
    accent: 'var(--clay-600)',
    success: 'var(--green-600)',
    danger: 'var(--red-600)',
    neutral: 'var(--text-primary)'
  };
  const up = deltaDirection === 'up';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      width: 30,
      height: 30,
      borderRadius: 'var(--radius-sm)',
      background: 'var(--blue-100)',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--blue-700)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 17,
    color: "currentColor"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-secondary)'
    }
  }, label)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 32,
      fontWeight: 600,
      color: tones[tone],
      lineHeight: 1,
      letterSpacing: '-0.02em'
    }
  }, value), delta != null && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2,
      fontSize: 13,
      fontWeight: 600,
      color: deltaDirection ? up ? 'var(--green-600)' : 'var(--red-600)' : 'var(--text-muted)'
    }
  }, deltaDirection && /*#__PURE__*/React.createElement(Icon, {
    name: up ? 'arrow-up-right' : 'arrow-down-right',
    size: 14,
    color: "currentColor"
  }), delta)));
}

/* ---- Timeline ---- */
const TL_TONE = {
  new: 'var(--status-new)',
  progress: 'var(--status-progress)',
  resolved: 'var(--status-resolved)',
  urgent: 'var(--status-urgent)',
  waiting: 'var(--status-waiting)',
  accent: 'var(--clay-500)'
};
function Timeline({
  items = [],
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      ...style
    }
  }, items.map((it, i) => {
    const color = TL_TONE[it.tone] || 'var(--neutral-400)';
    const last = i === items.length - 1;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        gap: 13,
        minHeight: last ? 'auto' : 54
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 28,
        height: 28,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: it.done === false ? 'var(--bg-surface)' : color,
        border: it.done === false ? '2px dashed var(--border-strong)' : 'none'
      }
    }, it.done !== false && /*#__PURE__*/React.createElement(Icon, {
      name: it.icon || 'check',
      size: 15,
      color: "#fff",
      strokeWidth: 2.6
    })), !last && /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        width: 2,
        background: 'var(--border-default)',
        marginTop: 2,
        marginBottom: 2
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        paddingBottom: last ? 0 : 14,
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        fontWeight: 600,
        color: it.done === false ? 'var(--text-muted)' : 'var(--text-primary)'
      }
    }, it.title), it.time && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-muted)',
        flexShrink: 0
      }
    }, it.time)), it.description && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--text-secondary)',
        marginTop: 2,
        lineHeight: 1.45
      }
    }, it.description)));
  }));
}
Object.assign(window, {
  Icon,
  Button,
  IconButton,
  Badge,
  Avatar,
  Card,
  Tabs,
  SegmentedControl,
  Input,
  Textarea,
  Field,
  Switch,
  Toast,
  Banner,
  Stat,
  Timeline
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/_shared/kit.jsx", error: String((e && e.message) || e) }); }

// ui_kits/citizen-app/app.jsx
try { (() => {
/* N2Bridge — Citizen mobile app screens */
(() => {
  const {
    useState
  } = React;
  const REPORTS = [{
    id: 'N2-48213',
    title: 'Pothole on Elm Street',
    cat: 'Roads',
    ward: 'Ward 7',
    status: 'progress',
    when: '2h ago',
    icon: 'construction'
  }, {
    id: 'N2-47980',
    title: 'Broken streetlight — Oak & 3rd',
    cat: 'Lighting',
    ward: 'Ward 7',
    status: 'waiting',
    when: '1d ago',
    icon: 'lightbulb'
  }, {
    id: 'N2-47120',
    title: 'Overflowing bin, Riverside Park',
    cat: 'Sanitation',
    ward: 'Ward 7',
    status: 'resolved',
    when: '5d ago',
    icon: 'trash-2'
  }];
  const STATUS_BADGE = {
    new: ['info', 'New'],
    progress: ['progress', 'In progress'],
    waiting: ['neutral', 'Awaiting reply'],
    resolved: ['success', 'Resolved'],
    urgent: ['danger', 'Urgent']
  };
  const CATEGORIES = [{
    key: 'Roads',
    icon: 'construction'
  }, {
    key: 'Lighting',
    icon: 'lightbulb'
  }, {
    key: 'Sanitation',
    icon: 'trash-2'
  }, {
    key: 'Parks',
    icon: 'trees'
  }, {
    key: 'Housing',
    icon: 'home'
  }, {
    key: 'Other',
    icon: 'circle-help'
  }];
  function StatusBadge({
    status
  }) {
    const [tone, label] = STATUS_BADGE[status];
    return /*#__PURE__*/React.createElement(Badge, {
      tone: tone,
      dot: true,
      size: "sm"
    }, label);
  }
  function PhoneStatusBar({
    dark
  }) {
    const c = dark ? '#fff' : 'var(--text-primary)';
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 22px',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        fontWeight: 600,
        color: c
      }
    }, "9:41"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        color: c
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "signal",
      size: 16,
      color: c
    }), /*#__PURE__*/React.createElement(Icon, {
      name: "wifi",
      size: 16,
      color: c
    }), /*#__PURE__*/React.createElement(Icon, {
      name: "battery-full",
      size: 18,
      color: c
    })));
  }

  /* ---------- Home ---------- */
  function HomeScreen({
    onReport,
    onOpen
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: 'auto'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--blue-700)',
        padding: '6px 20px 26px',
        borderRadius: '0 0 26px 26px'
      }
    }, /*#__PURE__*/React.createElement(PhoneStatusBar, {
      dark: true
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        color: 'var(--blue-200)'
      }
    }, "Good afternoon,"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 24,
        fontWeight: 600,
        color: '#fff',
        marginTop: 2
      }
    }, "Dana")), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: "bell",
      variant: "ghost",
      label: "Notifications",
      style: {
        color: '#fff',
        background: 'rgba(255,255,255,0.12)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: 'var(--clay-500)',
        border: '2px solid var(--blue-700)'
      }
    }))), /*#__PURE__*/React.createElement("div", {
      onClick: onReport,
      style: {
        marginTop: 18,
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        boxShadow: 'var(--shadow-md)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 46,
        height: 46,
        borderRadius: 'var(--radius-md)',
        background: 'var(--clay-100)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "megaphone",
      size: 24,
      color: "var(--clay-600)"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 16,
        fontWeight: 600,
        color: 'var(--text-primary)'
      }
    }, "Report an issue"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--text-secondary)',
        marginTop: 1
      }
    }, "Potholes, lighting, bins & more")), /*#__PURE__*/React.createElement(Icon, {
      name: "chevron-right",
      size: 20,
      color: "var(--text-muted)"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '22px 20px 16px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 19,
        fontWeight: 600,
        color: 'var(--text-primary)',
        whiteSpace: 'nowrap'
      }
    }, "Your reports"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-link)',
        whiteSpace: 'nowrap'
      }
    }, "See all")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 11
      }
    }, REPORTS.map(r => /*#__PURE__*/React.createElement(Card, {
      key: r.id,
      padding: "sm",
      interactive: true,
      onClick: () => onOpen(r),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-md)',
        background: 'var(--blue-50)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: r.icon,
      size: 20,
      color: "var(--blue-600)"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        fontWeight: 600,
        color: 'var(--text-primary)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, r.title), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        marginTop: 5
      }
    }, /*#__PURE__*/React.createElement(StatusBadge, {
      status: r.status
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: 'var(--text-muted)',
        whiteSpace: 'nowrap'
      }
    }, r.when))))))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '4px 20px 24px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 19,
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: 12
      }
    }, "From your ward"), /*#__PURE__*/React.createElement(Card, {
      padding: "none",
      style: {
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: 96,
        background: 'linear-gradient(120deg, var(--blue-600), var(--blue-800))',
        display: 'flex',
        alignItems: 'flex-end',
        padding: 12
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "accent",
      size: "sm"
    }, "Town hall")), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        fontWeight: 600,
        color: 'var(--text-primary)'
      }
    }, "Riverside budget meeting \u2014 Jun 24"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--text-secondary)',
        marginTop: 4,
        lineHeight: 1.45
      }
    }, "Rep. Alvarez is hosting an open session on the 2026 ward budget. RSVP to join.")))));
  }

  /* ---------- Report flow ---------- */
  function ReportScreen({
    onClose,
    onSubmit
  }) {
    const [step, setStep] = useState(0);
    const [cat, setCat] = useState(null);
    const [desc, setDesc] = useState('');
    const steps = ['Category', 'Details', 'Review'];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement(PhoneStatusBar, null), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '4px 16px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: step === 0 ? 'x' : 'arrow-left',
      variant: "ghost",
      label: "Back",
      onClick: () => step === 0 ? onClose() : setStep(step - 1)
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 18,
        fontWeight: 600
      }
    }, "New report"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6,
        padding: '0 20px 16px'
      }
    }, steps.map((s, i) => /*#__PURE__*/React.createElement("div", {
      key: s,
      style: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        background: i <= step ? 'var(--brand-action)' : 'var(--neutral-200)'
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: 'auto',
        padding: '0 20px 20px'
      }
    }, step === 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        fontWeight: 600,
        marginBottom: 4
      }
    }, "What's the issue about?"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--text-secondary)',
        marginBottom: 16
      }
    }, "We'll route it to the right ward office."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 11
      }
    }, CATEGORIES.map(c => /*#__PURE__*/React.createElement("div", {
      key: c.key,
      onClick: () => {
        setCat(c.key);
        setStep(1);
      },
      style: {
        background: cat === c.key ? 'var(--blue-50)' : 'var(--bg-surface)',
        border: '1px solid ' + (cat === c.key ? 'var(--border-brand)' : 'var(--border-default)'),
        borderRadius: 'var(--radius-lg)',
        padding: '18px 14px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: c.icon,
      size: 24,
      color: "var(--blue-600)"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        fontWeight: 600,
        color: 'var(--text-primary)'
      }
    }, c.key))))), step === 1 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }
    }, /*#__PURE__*/React.createElement(Banner, {
      tone: "info",
      title: cat + ' report'
    }, "Routed to Ward 7 \u2014 Riverside."), /*#__PURE__*/React.createElement(Field, {
      label: "Describe the issue"
    }, /*#__PURE__*/React.createElement(Textarea, {
      rows: 4,
      value: desc,
      onChange: e => setDesc(e.target.value),
      placeholder: "Tell us what's happening and where\u2026"
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Location"
    }, /*#__PURE__*/React.createElement(Input, {
      leadingIcon: "map-pin",
      value: "Elm Street, near #214",
      onChange: () => {}
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: 600,
        marginBottom: 6
      }
    }, "Photos"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 72,
        height: 72,
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-sunken)',
        border: '1.5px dashed var(--border-strong)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "camera",
      size: 22,
      color: "var(--text-muted)"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 72,
        height: 72,
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(135deg,#5A6472,#404A57)'
      }
    })))), step === 2 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(Card, {
      padding: "md"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "brand"
    }, cat), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)'
      }
    }, "Ward 7")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        color: 'var(--text-primary)',
        lineHeight: 1.5
      }
    }, desc || 'Large pothole forming near the crosswalk, getting worse after rain.'), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        color: 'var(--text-secondary)',
        fontSize: 13
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "map-pin",
      size: 15,
      color: "var(--text-muted)"
    }), "Elm Street, near #214")), /*#__PURE__*/React.createElement(Banner, {
      tone: "success",
      title: "You'll get updates",
      icon: "bell"
    }, "We'll notify you each time your case status changes."))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '12px 20px',
        borderTop: '1px solid var(--divider)',
        flexShrink: 0
      }
    }, step < 2 ? /*#__PURE__*/React.createElement(Button, {
      fullWidth: true,
      size: "lg",
      disabled: step === 0 && !cat,
      onClick: () => setStep(step + 1),
      trailingIcon: "arrow-right"
    }, "Continue") : /*#__PURE__*/React.createElement(Button, {
      fullWidth: true,
      size: "lg",
      variant: "accent",
      onClick: onSubmit,
      leadingIcon: "send"
    }, "Submit report")));
  }
  function SubmittedScreen({
    onDone
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement(PhoneStatusBar, null), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 36px',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 88,
        height: 88,
        borderRadius: '50%',
        background: 'var(--success-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 22
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 44,
      color: "var(--green-600)",
      strokeWidth: 2.5
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 26,
        fontWeight: 600,
        color: 'var(--text-primary)'
      }
    }, "Report submitted"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        color: 'var(--text-secondary)',
        marginTop: 8,
        lineHeight: 1.5
      }
    }, "Case ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        color: 'var(--blue-700)',
        fontWeight: 600
      }
    }, "N2-48231"), " is on its way to Ward 7. We'll keep you posted.")), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '12px 20px 16px'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      fullWidth: true,
      size: "lg",
      onClick: onDone
    }, "Back to home")));
  }

  /* ---------- Case detail ---------- */
  function CaseScreen({
    report,
    onClose
  }) {
    const r = report || REPORTS[0];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement(PhoneStatusBar, null), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '4px 16px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: "arrow-left",
      variant: "ghost",
      label: "Back",
      onClick: onClose
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        color: 'var(--text-muted)'
      }
    }, r.id)), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: 'auto',
        padding: '8px 20px 20px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        fontWeight: 600,
        color: 'var(--text-primary)',
        lineHeight: 1.2
      }
    }, r.title)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        marginTop: 10,
        marginBottom: 18
      }
    }, /*#__PURE__*/React.createElement(StatusBadge, {
      status: r.status
    }), /*#__PURE__*/React.createElement(Badge, {
      tone: "brand",
      size: "sm"
    }, r.cat), /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral",
      size: "sm"
    }, r.ward)), /*#__PURE__*/React.createElement(Card, {
      padding: "md",
      style: {
        marginBottom: 18
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: 12
      }
    }, "Progress"), /*#__PURE__*/React.createElement(Timeline, {
      items: [{
        title: 'Report received',
        time: 'Jun 14',
        tone: 'new',
        icon: 'inbox'
      }, {
        title: 'Assigned to Ward 7',
        time: 'Jun 14',
        tone: 'progress',
        icon: 'user-check',
        description: 'Caseworker: J. Okafor'
      }, {
        title: 'Crew scheduled',
        time: 'Jun 16',
        tone: 'progress',
        icon: 'calendar-check'
      }, {
        title: 'Resolved',
        tone: 'resolved',
        done: false
      }]
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: 8
      }
    }, "Latest from the office"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 11,
        alignItems: 'flex-start'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "Jordan Okafor",
      size: "md"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--blue-50)',
        borderRadius: '4px 14px 14px 14px',
        padding: '11px 13px',
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: 'var(--text-primary)',
        lineHeight: 1.5
      }
    }, "Thanks Dana \u2014 a crew is scheduled for Thursday. We'll mark this resolved once the repair is verified."), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--text-muted)',
        marginTop: 5,
        fontFamily: 'var(--font-mono)'
      }
    }, "Today \xB7 16:04")))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '12px 20px',
        borderTop: '1px solid var(--divider)',
        display: 'flex',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Input, {
      placeholder: "Reply to your caseworker\u2026",
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "send",
      variant: "solid",
      label: "Send"
    })));
  }

  /* ---------- Reps tab ---------- */
  const REPS = [{
    name: 'Rep. Maria Alvarez',
    role: 'Council, Ward 7',
    tag: 'Your representative'
  }, {
    name: 'Sen. David Kemp',
    role: 'State Senate, Dist. 12',
    tag: null
  }, {
    name: 'Mayor Lena Brooks',
    role: 'City of Riverside',
    tag: null
  }];
  function RepsScreen() {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement(PhoneStatusBar, null), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '4px 20px 16px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 24,
        fontWeight: 600,
        color: 'var(--text-primary)'
      }
    }, "Your representatives"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: 'var(--text-secondary)',
        marginTop: 3
      }
    }, "Riverside \xB7 Ward 7")), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: 'auto',
        padding: '0 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, REPS.map(rep => /*#__PURE__*/React.createElement(Card, {
      key: rep.name,
      padding: "md"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 13,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: rep.name,
      size: "lg"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 16,
        fontWeight: 600,
        color: 'var(--text-primary)'
      }
    }, rep.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--text-secondary)',
        marginTop: 1
      }
    }, rep.role), rep.tag && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 7
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "accent",
      size: "sm"
    }, rep.tag)))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 9,
        marginTop: 14
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      leadingIcon: "message-circle",
      style: {
        flex: 1
      }
    }, "Message"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      leadingIcon: "phone",
      style: {
        flex: 1
      }
    }, "Call office"))))));
  }

  /* ---------- Shell + nav ---------- */
  const TABS = [{
    k: 'home',
    icon: 'house',
    label: 'Home'
  }, {
    k: 'reps',
    icon: 'landmark',
    label: 'Reps'
  }, {
    k: 'reports',
    icon: 'file-text',
    label: 'Reports'
  }, {
    k: 'profile',
    icon: 'user',
    label: 'Profile'
  }];
  function CitizenApp() {
    const [tab, setTab] = useState('home');
    const [flow, setFlow] = useState(null); // 'report' | 'submitted' | {case}
    let screen;
    if (flow === 'report') screen = /*#__PURE__*/React.createElement(ReportScreen, {
      onClose: () => setFlow(null),
      onSubmit: () => setFlow('submitted')
    });else if (flow === 'submitted') screen = /*#__PURE__*/React.createElement(SubmittedScreen, {
      onDone: () => setFlow(null)
    });else if (flow && flow.id) screen = /*#__PURE__*/React.createElement(CaseScreen, {
      report: flow,
      onClose: () => setFlow(null)
    });else if (tab === 'home') screen = /*#__PURE__*/React.createElement(HomeScreen, {
      onReport: () => setFlow('report'),
      onOpen: r => setFlow(r)
    });else if (tab === 'reps') screen = /*#__PURE__*/React.createElement(RepsScreen, null);else if (tab === 'reports') screen = /*#__PURE__*/React.createElement(HomeScreen, {
      onReport: () => setFlow('report'),
      onOpen: r => setFlow(r)
    });else screen = /*#__PURE__*/React.createElement(RepsScreen, null);
    const hideNav = flow === 'report' || flow === 'submitted' || flow && flow.id;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-page)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }
    }, screen), !hideNav && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        borderTop: '1px solid var(--divider)',
        background: 'var(--bg-surface)',
        padding: '8px 8px 22px',
        flexShrink: 0
      }
    }, TABS.map(t => /*#__PURE__*/React.createElement("button", {
      key: t.k,
      onClick: () => setTab(t.k),
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: '4px 0'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: t.icon,
      size: 22,
      color: tab === t.k ? 'var(--brand-action)' : 'var(--text-muted)',
      strokeWidth: tab === t.k ? 2.2 : 1.8
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        fontWeight: tab === t.k ? 600 : 500,
        color: tab === t.k ? 'var(--brand-action)' : 'var(--text-muted)'
      }
    }, t.label)))));
  }
  window.CitizenApp = CitizenApp;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/citizen-app/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/notifications/app.jsx
try { (() => {
/* N2Bridge — Real-time notifications system showcase */
(() => {
  const {
    useState,
    useRef
  } = React;
  const FEED = [{
    tone: 'success',
    icon: 'circle-check',
    title: 'Case resolved',
    body: 'Pothole on Elm Street (N2-48213) was marked resolved by Ward 7.',
    time: '2m',
    unread: true
  }, {
    tone: 'message',
    avatar: 'Maria Alvarez',
    title: 'Rep. Alvarez replied',
    body: '“Thanks for flagging this — we’re on it. Crew goes out Thursday.”',
    time: '14m',
    unread: true
  }, {
    tone: 'progress',
    icon: 'user-check',
    title: 'Caseworker assigned',
    body: 'Jordan Okafor is now handling your Section 8 voucher case.',
    time: '1h',
    unread: true
  }, {
    tone: 'info',
    icon: 'calendar',
    title: 'Town hall reminder',
    body: 'Riverside budget meeting starts in 2 days. Tap to RSVP.',
    time: '3h',
    unread: false
  }, {
    tone: 'warning',
    icon: 'alert-triangle',
    title: 'Action needed',
    body: 'We couldn’t match your address to a ward. Verify to continue.',
    time: '1d',
    unread: false
  }];
  const EVENTS = [{
    tone: 'success',
    icon: 'circle-check',
    title: 'Case resolved',
    body: 'Ward 7 closed your pothole report. View the resolution photo.',
    timestamp: 'now'
  }, {
    tone: 'message',
    avatar: 'Maria Alvarez',
    title: 'Rep. Alvarez replied',
    body: '“We’ve scheduled the repair for Thursday morning.”',
    timestamp: 'now'
  }, {
    tone: 'progress',
    icon: 'truck',
    title: 'Crew dispatched',
    body: 'A Public Works crew is en route to Oak & 3rd.',
    timestamp: 'now'
  }, {
    tone: 'warning',
    icon: 'clock',
    title: 'SLA at risk',
    body: 'Case N2-48209 is approaching its 48-hour target.',
    timestamp: 'now'
  }, {
    tone: 'danger',
    icon: 'alert-octagon',
    title: 'Urgent escalation',
    body: 'A flooded storm drain in Ward 8 was flagged urgent.',
    timestamp: 'now'
  }];
  function Section({
    title,
    desc,
    children,
    style
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: style
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 19,
        fontWeight: 600,
        color: 'var(--text-primary)'
      }
    }, title), desc && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        color: 'var(--text-secondary)',
        marginTop: 3,
        marginBottom: 16,
        maxWidth: 460
      }
    }, desc), children);
  }
  function App() {
    const [toasts, setToasts] = useState([{
      ...EVENTS[0],
      key: 0
    }]);
    const idRef = useRef(1);
    const [prefs, setPrefs] = useState({
      push: true,
      email: true,
      sms: false,
      digest: true
    });
    function fire(ev) {
      const key = idRef.current++;
      setToasts(t => [...t, {
        ...ev,
        key
      }]);
      setTimeout(() => setToasts(t => t.filter(x => x.key !== key)), 5200);
    }
    function dismiss(key) {
      setToasts(t => t.filter(x => x.key !== key));
    }
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: '100vh',
        background: 'var(--bg-page)',
        fontFamily: 'var(--font-sans)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--blue-900)',
        padding: '26px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 13
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logo-mark.svg",
      width: "38",
      height: "38"
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        fontWeight: 600,
        color: '#fff'
      }
    }, "Real-time notifications"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--blue-300)'
      }
    }, "One event model \xB7 in-app toasts, the notification center, push & email"))), /*#__PURE__*/React.createElement(Badge, {
      tone: "success",
      dot: true
    }, "Live")), /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 1180,
        margin: '0 auto',
        padding: 32,
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: 28,
        alignItems: 'start'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 32
      }
    }, /*#__PURE__*/React.createElement(Section, {
      title: "Trigger a live event",
      desc: "Each platform event renders as a toast in the bottom-right, then syncs to the notification center, push, and email. Try firing a few."
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap'
      }
    }, EVENTS.map((ev, i) => /*#__PURE__*/React.createElement(Button, {
      key: i,
      variant: i === 0 ? 'primary' : 'secondary',
      size: "sm",
      leadingIcon: ev.avatar ? 'message-circle' : ev.icon,
      onClick: () => fire(ev)
    }, ev.title)))), /*#__PURE__*/React.createElement(Section, {
      title: "Toast anatomy",
      desc: "The toast is the visual unit of the system \u2014 an accent rail by severity, an icon or sender avatar, a timestamp, and optional actions."
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Toast, {
      tone: "success",
      title: "Case resolved",
      timestamp: "now",
      onDismiss: () => {}
    }, "Ward 7 closed your pothole report."), /*#__PURE__*/React.createElement(Toast, {
      tone: "message",
      avatar: /*#__PURE__*/React.createElement(Avatar, {
        name: "Maria Alvarez",
        size: "md"
      }),
      title: "Rep. Alvarez replied",
      timestamp: "2m",
      onDismiss: () => {},
      action: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "secondary"
      }, "Reply"), /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "ghost"
      }, "Open case"))
    }, "\u201CThanks for flagging this \u2014 we\u2019re on it.\u201D"), /*#__PURE__*/React.createElement(Toast, {
      tone: "warning",
      title: "SLA at risk",
      timestamp: "now",
      onDismiss: () => {}
    }, "Case N2-48209 is approaching its 48-hour target."))), /*#__PURE__*/React.createElement(Section, {
      title: "Email notification",
      desc: "The same event, delivered to inbox with the brand lockup and a single clear action."
    }, /*#__PURE__*/React.createElement(Card, {
      padding: "none",
      style: {
        overflow: 'hidden',
        maxWidth: 560
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--blue-700)',
        padding: '16px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logo-wordmark-light.svg",
      height: "26"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '26px 24px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'inline-flex',
        width: 46,
        height: 46,
        borderRadius: '50%',
        background: 'var(--success-bg)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "circle-check",
      size: 24,
      color: "var(--green-600)"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        fontWeight: 600,
        color: 'var(--text-primary)'
      }
    }, "Your case was resolved"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14.5,
        color: 'var(--text-secondary)',
        marginTop: 8,
        lineHeight: 1.55
      }
    }, "Hi Dana \u2014 Ward 7 marked your report ", /*#__PURE__*/React.createElement("strong", {
      style: {
        color: 'var(--text-primary)'
      }
    }, "\u201CPothole on Elm Street\u201D"), " as resolved. Here\u2019s the closing note from your caseworker:"), /*#__PURE__*/React.createElement("div", {
      style: {
        borderLeft: '3px solid var(--blue-300)',
        background: 'var(--blue-50)',
        padding: '12px 14px',
        borderRadius: '0 8px 8px 0',
        margin: '14px 0',
        fontSize: 14,
        color: 'var(--text-primary)',
        lineHeight: 1.5
      }
    }, "\u201CThe pothole was filled Thursday morning and the repair has been verified. Thanks for keeping Ward 7 safe.\u201D"), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement(Button, {
      leadingIcon: "external-link"
    }, "View case & photo"))), /*#__PURE__*/React.createElement("div", {
      style: {
        borderTop: '1px solid var(--divider)',
        padding: '14px 24px',
        fontSize: 12,
        color: 'var(--text-muted)',
        display: 'flex',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("span", null, "N2Bridge \xB7 City of Riverside"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-link)'
      }
    }, "Manage preferences"))))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        position: 'sticky',
        top: 32
      }
    }, /*#__PURE__*/React.createElement(Card, {
      padding: "none",
      style: {
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '15px 18px',
        borderBottom: '1px solid var(--divider)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 9
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "bell",
      size: 19,
      color: "var(--blue-700)"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 16,
        fontWeight: 600
      }
    }, "Notifications"), /*#__PURE__*/React.createElement(Badge, {
      tone: "danger",
      size: "sm"
    }, "3")), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 600,
        color: 'var(--text-link)',
        cursor: 'pointer'
      }
    }, "Mark all read")), /*#__PURE__*/React.createElement("div", {
      style: {
        maxHeight: 420,
        overflowY: 'auto'
      }
    }, FEED.map((n, i) => {
      const accent = {
        success: 'var(--green-500)',
        message: 'var(--clay-500)',
        progress: 'var(--amber-500)',
        info: 'var(--blue-500)',
        warning: 'var(--amber-500)'
      }[n.tone];
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        style: {
          display: 'flex',
          gap: 11,
          padding: '13px 18px',
          borderTop: i ? '1px solid var(--divider)' : 'none',
          background: n.unread ? 'var(--blue-50)' : 'transparent',
          cursor: 'pointer'
        }
      }, n.avatar ? /*#__PURE__*/React.createElement(Avatar, {
        name: n.avatar,
        size: "md"
      }) : /*#__PURE__*/React.createElement("span", {
        style: {
          flexShrink: 0,
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'color-mix(in srgb,' + accent + ' 14%, transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: n.icon,
        size: 19,
        color: accent
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-primary)'
        }
      }, n.title), /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          flexShrink: 0
        }
      }, n.time)), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          color: 'var(--text-secondary)',
          marginTop: 2,
          lineHeight: 1.45
        }
      }, n.body)), n.unread && /*#__PURE__*/React.createElement("span", {
        style: {
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--brand-action)',
          flexShrink: 0,
          marginTop: 6
        }
      }));
    }))), /*#__PURE__*/React.createElement(Card, {
      padding: "md"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 16,
        fontWeight: 600,
        marginBottom: 4
      }
    }, "Delivery preferences"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--text-secondary)',
        marginBottom: 16
      }
    }, "How constituents choose to hear from you."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, [['push', 'phone', 'Push notifications', 'Instant, on your device'], ['email', 'mail', 'Email', 'Full detail + actions'], ['sms', 'message-square', 'SMS alerts', 'Urgent updates only'], ['digest', 'newspaper', 'Weekly digest', 'A Monday summary']].map(([k, ic, label, sub]) => /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 36,
        height: 36,
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-sunken)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: ic,
      size: 18,
      color: "var(--blue-700)"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text-primary)'
      }
    }, label), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--text-muted)'
      }
    }, sub)), /*#__PURE__*/React.createElement(Switch, {
      checked: prefs[k],
      onChange: v => setPrefs(p => ({
        ...p,
        [k]: v
      }))
    }))))))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'fixed',
        right: 24,
        bottom: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        zIndex: 500,
        alignItems: 'flex-end'
      }
    }, toasts.map(t => /*#__PURE__*/React.createElement("div", {
      key: t.key,
      style: {
        animation: 'n2toastin .32s cubic-bezier(.2,.8,.2,1)'
      }
    }, /*#__PURE__*/React.createElement(Toast, {
      tone: t.tone,
      icon: t.icon,
      avatar: t.avatar ? /*#__PURE__*/React.createElement(Avatar, {
        name: t.avatar,
        size: "md"
      }) : null,
      title: t.title,
      timestamp: t.timestamp,
      onDismiss: () => dismiss(t.key)
    }, t.body)))), /*#__PURE__*/React.createElement("style", null, '@keyframes n2toastin{from{opacity:0;transform:translateX(24px) scale(.96)}to{opacity:1;transform:none}}'));
  }
  window.NotificationsApp = App;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/notifications/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/rep-dashboard/app.jsx
try { (() => {
/* N2Bridge — Representative web dashboard */
(() => {
  const {
    useState
  } = React;
  const D = window.REP_DATA;
  function StatusBadge({
    status,
    size
  }) {
    const [tone, label] = D.statusMeta[status];
    return /*#__PURE__*/React.createElement(Badge, {
      tone: tone,
      dot: true,
      size: size
    }, label);
  }
  const NAV = [{
    k: 'overview',
    icon: 'layout-dashboard',
    label: 'Overview'
  }, {
    k: 'cases',
    icon: 'inbox',
    label: 'Cases',
    count: 24
  }, {
    k: 'messages',
    icon: 'message-square',
    label: 'Messages',
    count: 6
  }, {
    k: 'constituents',
    icon: 'users',
    label: 'Constituents'
  }, {
    k: 'map',
    icon: 'map',
    label: 'Ward map'
  }, {
    k: 'analytics',
    icon: 'bar-chart-3',
    label: 'Analytics'
  }];
  function Sidebar({
    active,
    onNav
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: 248,
        flexShrink: 0,
        background: 'var(--blue-900)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 14px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '4px 8px 22px'
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logo-mark.svg",
      width: "34",
      height: "34"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 20,
        fontWeight: 600,
        color: '#fff'
      }
    }, "N", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--clay-400)'
      }
    }, "2"), "Bridge")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        flex: 1
      }
    }, NAV.map(n => {
      const a = n.k === active;
      return /*#__PURE__*/React.createElement("button", {
        key: n.k,
        onClick: () => onNav(n.k),
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          padding: '10px 12px',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          background: a ? 'rgba(255,255,255,0.12)' : 'transparent',
          color: a ? '#fff' : 'var(--blue-200)',
          textAlign: 'left',
          transition: 'background var(--dur-fast)'
        },
        onMouseEnter: e => {
          if (!a) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        },
        onMouseLeave: e => {
          if (!a) e.currentTarget.style.background = 'transparent';
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: n.icon,
        size: 19,
        color: "currentColor",
        strokeWidth: a ? 2.2 : 1.8
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: 'var(--font-sans)',
          fontSize: 14.5,
          fontWeight: a ? 600 : 500,
          flex: 1
        }
      }, n.label), n.count && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          fontWeight: 700,
          minWidth: 20,
          height: 20,
          padding: '0 6px',
          borderRadius: 999,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: a ? 'var(--clay-500)' : 'rgba(255,255,255,0.14)',
          color: '#fff'
        }
      }, n.count));
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        borderTop: '1px solid rgba(255,255,255,0.1)',
        paddingTop: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "Jordan Okafor",
      size: "md",
      status: "online"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 13.5,
        fontWeight: 600,
        color: '#fff',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, "Jordan Okafor"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--blue-300)'
      }
    }, "Caseworker \xB7 Ward 7")), /*#__PURE__*/React.createElement(Icon, {
      name: "chevron-down",
      size: 16,
      color: "var(--blue-300)"
    })));
  }
  function Topbar({
    title,
    subtitle
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 28px',
        borderBottom: '1px solid var(--divider)',
        background: 'var(--bg-surface)',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        fontWeight: 600,
        color: 'var(--text-primary)',
        lineHeight: 1.1
      }
    }, title), subtitle && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--text-secondary)',
        marginTop: 3
      }
    }, subtitle)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Input, {
      leadingIcon: "search",
      placeholder: "Search cases, people\u2026",
      style: {
        width: 260
      }
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "bell",
      variant: "outline",
      label: "Notifications"
    }), /*#__PURE__*/React.createElement(Button, {
      leadingIcon: "plus"
    }, "New case")));
  }

  /* ---------- Overview ---------- */
  function StatusBar() {
    const rows = [['New', 4, 'var(--status-new)'], ['In progress', 9, 'var(--status-progress)'], ['Awaiting reply', 6, 'var(--status-waiting)'], ['Urgent', 2, 'var(--status-urgent)'], ['Resolved (mo)', 31, 'var(--status-resolved)']];
    const max = 31;
    return /*#__PURE__*/React.createElement(Card, {
      padding: "md"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        fontWeight: 600,
        marginBottom: 16
      }
    }, "Cases by status"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 13
      }
    }, rows.map(([label, val, color]) => /*#__PURE__*/React.createElement("div", {
      key: label,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 100,
        fontSize: 13,
        color: 'var(--text-secondary)'
      }
    }, label), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        height: 9,
        background: 'var(--neutral-100)',
        borderRadius: 999,
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: val / max * 100 + '%',
        height: '100%',
        background: color,
        borderRadius: 999
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 26,
        textAlign: 'right',
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-primary)'
      }
    }, val)))));
  }
  function Overview({
    onOpen
  }) {
    const recent = D.cases.slice(0, 5);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: 'auto',
        padding: 28,
        background: 'var(--bg-page)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4,1fr)',
        gap: 16,
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement(Card, {
      padding: "md"
    }, /*#__PURE__*/React.createElement(Stat, {
      icon: "inbox",
      label: "Open cases",
      value: "142",
      delta: "8%",
      deltaDirection: "up"
    })), /*#__PURE__*/React.createElement(Card, {
      padding: "md"
    }, /*#__PURE__*/React.createElement(Stat, {
      icon: "clock",
      label: "Avg. resolution",
      value: "3.2d",
      delta: "0.4d",
      deltaDirection: "down",
      tone: "success"
    })), /*#__PURE__*/React.createElement(Card, {
      padding: "md"
    }, /*#__PURE__*/React.createElement(Stat, {
      icon: "circle-check",
      label: "Resolved (mo)",
      value: "318",
      tone: "brand"
    })), /*#__PURE__*/React.createElement(Card, {
      padding: "md"
    }, /*#__PURE__*/React.createElement(Stat, {
      icon: "message-square",
      label: "Response rate",
      value: "96%",
      tone: "accent"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: 16,
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement(Card, {
      padding: "md"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        fontWeight: 600
      }
    }, "Recent cases"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-link)',
        cursor: 'pointer'
      }
    }, "View all")), /*#__PURE__*/React.createElement("div", null, recent.map((c, i) => /*#__PURE__*/React.createElement("div", {
      key: c.id,
      onClick: () => onOpen(c),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 4px',
        borderTop: i ? '1px solid var(--divider)' : 'none',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: c.name,
      size: "sm"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text-primary)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, c.title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--text-muted)'
      }
    }, c.name, " \xB7 ", c.ward)), /*#__PURE__*/React.createElement(StatusBadge, {
      status: c.status,
      size: "sm"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--text-muted)',
        width: 28,
        textAlign: 'right'
      }
    }, c.age))))), /*#__PURE__*/React.createElement(StatusBar, null)), /*#__PURE__*/React.createElement(Banner, {
      tone: "warning",
      title: "2 urgent cases need an assignee",
      action: /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "secondary"
      }, "Review queue")
    }, "Marcus Lee's voucher delay and a flooded drain in Ward 8 are unassigned."));
  }

  /* ---------- Cases inbox ---------- */
  function CasesInbox({
    onOpen
  }) {
    const [tab, setTab] = useState('all');
    const [sel, setSel] = useState(null);
    const filtered = tab === 'all' ? D.cases : D.cases.filter(c => tab === 'unassigned' ? !c.assignee : c.status === tab);
    const counts = {
      all: D.cases.length,
      new: D.cases.filter(c => c.status === 'new').length,
      progress: D.cases.filter(c => c.status === 'progress').length,
      urgent: D.cases.filter(c => c.status === 'urgent').length,
      unassigned: D.cases.filter(c => !c.assignee).length
    };
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-page)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '14px 28px 0',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--divider)'
      }
    }, /*#__PURE__*/React.createElement(Tabs, {
      value: tab,
      onChange: setTab,
      items: [{
        value: 'all',
        label: 'All cases',
        count: counts.all
      }, {
        value: 'new',
        label: 'New',
        count: counts.new
      }, {
        value: 'progress',
        label: 'In progress',
        count: counts.progress
      }, {
        value: 'urgent',
        label: 'Urgent',
        count: counts.urgent
      }, {
        value: 'unassigned',
        label: 'Unassigned',
        count: counts.unassigned
      }]
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '14px 28px',
        display: 'flex',
        gap: 10,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      leadingIcon: "sliders-horizontal"
    }, "Filters"), /*#__PURE__*/React.createElement(Badge, {
      tone: "brand"
    }, "Ward 7"), /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, "This week"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: 'var(--text-muted)'
      }
    }, filtered.length, " cases")), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: 'auto',
        padding: '0 28px 28px'
      }
    }, /*#__PURE__*/React.createElement(Card, {
      padding: "none",
      style: {
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '34px 1.7fr 0.8fr 1fr 1fr 60px',
        gap: 12,
        padding: '11px 16px',
        background: 'var(--bg-subtle)',
        borderBottom: '1px solid var(--divider)',
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)'
      }
    }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null, "Case"), /*#__PURE__*/React.createElement("span", null, "Status"), /*#__PURE__*/React.createElement("span", null, "Assignee"), /*#__PURE__*/React.createElement("span", null, "Category"), /*#__PURE__*/React.createElement("span", {
      style: {
        textAlign: 'right'
      }
    }, "Age")), filtered.map((c, i) => /*#__PURE__*/React.createElement("div", {
      key: c.id,
      onClick: () => onOpen(c),
      onMouseEnter: () => setSel(c.id),
      onMouseLeave: () => setSel(null),
      style: {
        display: 'grid',
        gridTemplateColumns: '34px 1.7fr 0.8fr 1fr 1fr 60px',
        gap: 12,
        padding: '12px 16px',
        alignItems: 'center',
        borderTop: i ? '1px solid var(--divider)' : 'none',
        cursor: 'pointer',
        background: sel === c.id ? 'var(--blue-50)' : 'transparent'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: c.name,
      size: "sm"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 7
      }
    }, c.priority === 'high' && /*#__PURE__*/React.createElement("span", {
      title: "High priority",
      style: {
        display: 'inline-flex'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "flag",
      size: 13,
      color: "var(--red-500)"
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text-primary)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, c.title)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 3,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: D.channelIcon[c.channel],
      size: 12,
      color: "var(--text-muted)"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: 'var(--text-muted)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, c.name, " \xB7 ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)'
      }
    }, c.id)))), /*#__PURE__*/React.createElement(StatusBadge, {
      status: c.status,
      size: "sm"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        minWidth: 0
      }
    }, c.assignee ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Avatar, {
      name: c.assignee,
      size: "xs"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: 'var(--text-secondary)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, c.assignee.split(' ')[0])) : /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: 'var(--clay-600)',
        fontWeight: 600
      }
    }, "Unassigned")), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: 'var(--text-secondary)'
      }
    }, c.cat), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--text-muted)',
        textAlign: 'right'
      }
    }, c.age))))));
  }

  /* ---------- Case detail ---------- */
  function CaseDetail({
    c,
    onClose
  }) {
    const [reply, setReply] = useState('');
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-page)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '16px 28px',
        borderBottom: '1px solid var(--divider)',
        background: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      leadingIcon: "arrow-left",
      onClick: onClose
    }, "Cases"), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 1,
        height: 24,
        background: 'var(--divider)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 20,
        fontWeight: 600,
        color: 'var(--text-primary)'
      }
    }, c.title), /*#__PURE__*/React.createElement(StatusBadge, {
      status: c.status,
      size: "sm"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--text-muted)',
        marginTop: 2
      }
    }, c.id, " \xB7 opened ", c.age, " ago")), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      leadingIcon: "user-plus"
    }, "Reassign"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      leadingIcon: "check"
    }, "Mark resolved")), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '1fr 320px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        overflowY: 'auto',
        padding: 28
      }
    }, /*#__PURE__*/React.createElement(Card, {
      padding: "md",
      style: {
        marginBottom: 18
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: 14
      }
    }, "Case timeline"), /*#__PURE__*/React.createElement(Timeline, {
      items: [{
        title: 'Report received',
        time: 'Jun 14 · 09:12',
        tone: 'new',
        icon: 'inbox',
        description: 'Submitted via ' + c.channel
      }, {
        title: 'Assigned to ' + (c.assignee || 'Ward 7'),
        time: 'Jun 14 · 09:40',
        tone: 'progress',
        icon: 'user-check'
      }, {
        title: 'Crew scheduled',
        time: 'Jun 16 · 11:02',
        tone: 'progress',
        icon: 'calendar-check',
        description: 'Public Works — Thursday AM'
      }, {
        title: 'Resolved',
        tone: 'resolved',
        done: false
      }]
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: 12
      }
    }, "Conversation"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 11
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: c.name,
      size: "md"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: '4px 12px 12px 12px',
        padding: '11px 13px',
        maxWidth: 460
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: 'var(--text-primary)',
        lineHeight: 1.5
      }
    }, "The pothole near the crosswalk is getting worse after the rain \u2014 it's a hazard for cyclists."), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--text-muted)',
        marginTop: 5,
        fontFamily: 'var(--font-mono)'
      }
    }, "Jun 14 \xB7 09:12"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 11,
        flexDirection: 'row-reverse'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "Jordan Okafor",
      size: "md"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--blue-700)',
        borderRadius: '12px 4px 12px 12px',
        padding: '11px 13px',
        maxWidth: 460
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: '#fff',
        lineHeight: 1.5
      }
    }, "Thanks Dana \u2014 logged it with Public Works. A crew is scheduled for Thursday."), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--blue-300)',
        marginTop: 5,
        fontFamily: 'var(--font-mono)'
      }
    }, "Jun 16 \xB7 11:05")))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10,
        alignItems: 'flex-end'
      }
    }, /*#__PURE__*/React.createElement(Textarea, {
      rows: 2,
      value: reply,
      onChange: e => setReply(e.target.value),
      placeholder: "Reply to the constituent\u2026",
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement(Button, {
      leadingIcon: "send"
    }, "Send"))), /*#__PURE__*/React.createElement("div", {
      style: {
        borderLeft: '1px solid var(--divider)',
        overflowY: 'auto',
        padding: 20,
        background: 'var(--bg-surface)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 18
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: c.name,
      size: "lg"
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 16,
        fontWeight: 600
      }
    }, c.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--text-secondary)'
      }
    }, c.ward, " \xB7 Constituent"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        marginBottom: 18
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      leadingIcon: "phone",
      style: {
        flex: 1
      }
    }, "Call"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      leadingIcon: "mail",
      style: {
        flex: 1
      }
    }, "Email")), [['Category', c.cat], ['Priority', c.priority], ['Channel', c.channel], ['Assignee', c.assignee || 'Unassigned'], ['SLA target', '2.4 days'], ['Constituent since', '2021']].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '9px 0',
        borderTop: '1px solid var(--divider)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: 'var(--text-muted)'
      }
    }, k), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-primary)',
        textTransform: k === 'Priority' || k === 'Channel' ? 'capitalize' : 'none'
      }
    }, v))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        marginBottom: 8
      }
    }, "Tags"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "accent",
      size: "sm"
    }, c.cat), /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral",
      size: "sm"
    }, "Repeat issue"))))));
  }

  /* ---------- Shell ---------- */
  const PAGE = {
    overview: ['Overview', "Ward 7 — Riverside · Today"],
    cases: ['Cases', 'Constituent casework queue'],
    messages: ['Messages', 'Direct conversations'],
    constituents: ['Constituents', '8,412 people in your ward'],
    map: ['Ward map', 'Cases by location'],
    analytics: ['Analytics', 'Performance & trends']
  };
  function RepDashboard() {
    const [nav, setNav] = useState('cases');
    const [openCase, setOpenCase] = useState(null);
    let body;
    if (openCase) body = /*#__PURE__*/React.createElement(CaseDetail, {
      c: openCase,
      onClose: () => setOpenCase(null)
    });else if (nav === 'overview') body = /*#__PURE__*/React.createElement(Overview, {
      onOpen: setOpenCase
    });else if (nav === 'cases') body = /*#__PURE__*/React.createElement(CasesInbox, {
      onOpen: setOpenCase
    });else body = /*#__PURE__*/React.createElement(Overview, {
      onOpen: setOpenCase
    });
    const [title, sub] = PAGE[nav] || PAGE.cases;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)'
      }
    }, /*#__PURE__*/React.createElement(Sidebar, {
      active: nav,
      onNav: k => {
        setNav(k);
        setOpenCase(null);
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }
    }, !openCase && /*#__PURE__*/React.createElement(Topbar, {
      title: title,
      subtitle: sub
    }), body));
  }
  window.RepDashboard = RepDashboard;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/rep-dashboard/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/rep-dashboard/data.js
try { (() => {
/* N2Bridge — Representative dashboard data */
(() => {
  window.REP_DATA = {
    cases: [{
      id: 'N2-48213',
      name: 'Dana Whitfield',
      title: 'Pothole on Elm Street',
      cat: 'Roads',
      ward: 'Ward 7',
      status: 'progress',
      priority: 'normal',
      assignee: 'Jordan Okafor',
      age: '2h',
      channel: 'app'
    }, {
      id: 'N2-48209',
      name: 'Marcus Lee',
      title: 'Section 8 voucher delay',
      cat: 'Housing',
      ward: 'Ward 7',
      status: 'urgent',
      priority: 'high',
      assignee: 'Jordan Okafor',
      age: '3h',
      channel: 'email'
    }, {
      id: 'N2-48201',
      name: 'Priya Raman',
      title: 'Streetlight out — Oak & 3rd',
      cat: 'Lighting',
      ward: 'Ward 8',
      status: 'new',
      priority: 'normal',
      assignee: null,
      age: '5h',
      channel: 'phone'
    }, {
      id: 'N2-48188',
      name: 'Theo Sanders',
      title: 'Noise complaint, 14 Birch Ln',
      cat: 'Other',
      ward: 'Ward 7',
      status: 'waiting',
      priority: 'low',
      assignee: 'Amara Diallo',
      age: '1d',
      channel: 'app'
    }, {
      id: 'N2-48160',
      name: 'Grace Kim',
      title: 'Flooded storm drain',
      cat: 'Sanitation',
      ward: 'Ward 8',
      status: 'progress',
      priority: 'high',
      assignee: 'Amara Diallo',
      age: '1d',
      channel: 'app'
    }, {
      id: 'N2-48142',
      name: 'Owen Brooks',
      title: 'Park bench vandalism',
      cat: 'Parks',
      ward: 'Ward 7',
      status: 'new',
      priority: 'low',
      assignee: null,
      age: '2d',
      channel: 'email'
    }, {
      id: 'N2-48090',
      name: 'Lucia Ferraro',
      title: 'Bus shelter accessibility',
      cat: 'Other',
      ward: 'Ward 8',
      status: 'resolved',
      priority: 'normal',
      assignee: 'Jordan Okafor',
      age: '3d',
      channel: 'app'
    }, {
      id: 'N2-48051',
      name: 'Sam Whitley',
      title: 'Overgrown lot, 9 Pine St',
      cat: 'Sanitation',
      ward: 'Ward 7',
      status: 'resolved',
      priority: 'normal',
      assignee: 'Amara Diallo',
      age: '4d',
      channel: 'phone'
    }],
    statusMeta: {
      new: ['info', 'New'],
      progress: ['progress', 'In progress'],
      waiting: ['neutral', 'Awaiting reply'],
      urgent: ['danger', 'Urgent'],
      resolved: ['success', 'Resolved']
    },
    channelIcon: {
      app: 'smartphone',
      email: 'mail',
      phone: 'phone'
    }
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/rep-dashboard/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardHeader = __ds_scope.CardHeader;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Stat = __ds_scope.Stat;

__ds_ns.Timeline = __ds_scope.Timeline;

__ds_ns.Banner = __ds_scope.Banner;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
