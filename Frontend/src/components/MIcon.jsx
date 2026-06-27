import {
  FaCheckCircle, FaBolt, FaUsers, FaVoteYea, FaCalendarAlt,
  FaChevronDown, FaChevronUp, FaShareAlt, FaHourglassHalf, FaBell,
  FaBalanceScale, FaExclamationTriangle, FaArrowUp, FaArrowDown,
  FaQuestionCircle, FaHistory, FaImage, FaMapMarkerAlt, FaInfoCircle,
  FaPaperPlane, FaClock, FaBullhorn, FaTimesCircle, FaSyncAlt,
  FaEnvelope, FaPhone, FaUserPlus, FaLaptop, FaTrashAlt, FaVolumeUp,
  FaExclamationCircle, FaChartLine, FaTimes, FaCheck, FaStar,
  FaShieldAlt, FaKey, FaDesktop, FaUserCog, FaUser, FaSearch,
  FaTint, FaRoad, FaClipboardList,
} from "react-icons/fa";
import { MdVerified, MdBalance, MdWarning } from "react-icons/md";

const MAP = {
  // KPI / stats
  task_alt:            FaCheckCircle,
  bolt:                FaBolt,
  groups:              FaUsers,
  how_to_vote:         FaVoteYea,
  // Election scenarios
  verified:            MdVerified,
  balance:             MdBalance,
  warning:             MdWarning,
  // Trend / direction
  arrow_upward:        FaArrowUp,
  arrow_downward:      FaArrowDown,
  trending_up:         FaChartLine,
  trending_down:       FaChartLine,
  // Topbar controls
  calendar_month:      FaCalendarAlt,
  expand_more:         FaChevronDown,
  expand_less:         FaChevronUp,
  ios_share:           FaShareAlt,
  hourglass_top:       FaHourglassHalf,
  hourglass_empty:     FaHourglassHalf,
  notifications:       FaBell,
  help:                FaQuestionCircle,
  // Communication
  history:             FaHistory,
  add_photo_alternate: FaImage,
  place:               FaMapMarkerAlt,
  location_on:         FaMapMarkerAlt,
  info:                FaInfoCircle,
  send:                FaPaperPlane,
  schedule:            FaClock,
  schedule_send:       FaPaperPlane,
  campaign:            FaBullhorn,
  // Settings & status
  error:               FaTimesCircle,
  check_circle:        FaCheckCircle,
  sync:                FaSyncAlt,
  mail:                FaEnvelope,
  call:                FaPhone,
  person_add:          FaUserPlus,
  group:               FaUsers,
  devices:             FaLaptop,
  desktop_mac:         FaDesktop,
  security:            FaShieldAlt,
  key:                 FaKey,
  manage_accounts:     FaUserCog,
  priority_high:       FaExclamationCircle,
  // Person / profile
  person:              FaUser,
  account_circle:      FaUser,
  // Security
  shield:              FaShieldAlt,
  // Common backend-dynamic icons
  delete:              FaTrashAlt,
  delete_outline:      FaTrashAlt,
  volume_up:           FaVolumeUp,
  report:              FaExclamationCircle,
  report_problem:      FaExclamationTriangle,
  close:               FaTimes,
  done:                FaCheck,
  star:                FaStar,
  search:              FaSearch,
  // Complaint categories
  water_drop:          FaTint,
  water:               FaTint,
  road:                FaRoad,
  directions_car:      FaRoad,
  trash:               FaTrashAlt,
  delete_forever:      FaTrashAlt,
  noise:               FaVolumeUp,
  clipboard:           FaClipboardList,
  list_alt:            FaClipboardList,
};

export default function MIcon({ name, style }) {
  const Comp = MAP[name];
  const sz = style?.fontSize ?? 21;

  if (Comp) {
    return (
      <Comp
        style={{
          fontSize: sz,
          width: sz,
          height: sz,
          flexShrink: 0,
          display: "inline-block",
          verticalAlign: "middle",
          ...style,
        }}
      />
    );
  }

  // Fallback: small neutral dot for unknown icon names
  return (
    <span
      style={{
        display: "inline-block",
        width: sz * 0.55,
        height: sz * 0.55,
        borderRadius: "50%",
        background: style?.color ?? "#C0C7D4",
        flexShrink: 0,
        verticalAlign: "middle",
      }}
    />
  );
}
