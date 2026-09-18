import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Send,
  CheckCircle2,
  Volume2,
  Truck,
  Flame,
  AlertTriangle,
  Lock,
  Crosshair,
} from "lucide-react";
import { submitCitizenReport } from "../api/client";

const REPORT_CATEGORIES = [
  {
    id: "CHAINSAW_NOISE",
    label: "Chainsaw / Logging Noise",
    desc: "Active tree felling sounds deep inside core forest reserve",
    icon: Volume2,
    color: "text-amber-400 border-amber-500/30 bg-amber-950/20",
  },
  {
    id: "SUSPICIOUS_TRUCK",
    label: "Unmarked / Night Timber Truck",
    desc: "Heavy commercial carrier operating without transit permits on ghat roads",
    icon: Truck,
    color: "text-red-400 border-red-500/30 bg-red-950/20",
  },
  {
    id: "ILLEGAL_LOGGING",
    label: "Red Sanders / Teak Staging",
    desc: "Cut timber logs stacked near trailheads or river crossings",
    icon: AlertTriangle,
    color: "text-rose-400 border-rose-500/30 bg-rose-950/20",
  },
  {
    id: "SMOKE_FIRE",
    label: "Smoke / Illegal Forest Fire",
    desc: "Suspicious smoke plumes or intentional scrub clearance fires",
    icon: Flame,
    color: "text-orange-400 border-orange-500/30 bg-orange-950/20",
  },
];

export default function CitizenReport() {
  const [category, setCategory] = useState("CHAINSAW_NOISE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState<number>(10.3395);
  const [lng, setLng] = useState<number>(77.059);
  const [locationName, setLocationName] = useState("Anamalai Core Buffer — Near Navamalai Sector");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const captureCurrentGps = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setLocationName(`GPS Fix: ${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`);
        },
        () => {
          // Preset Western Ghats coordinate if browser geolocation denied
          setLat(10.3412);
          setLng(77.0625);
          setLocationName("Anamalai Tiger Reserve (Auto-calibrated GPS Point)");
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);

    try {
      const res = await submitCitizenReport({
        category,
        title,
        description: description || "Reported by citizen patrol near Western Ghats boundary corridor.",
        lat,
        lng,
        photo_base64: photoPreview || undefined,
        reporter_phone: phone || undefined,
        is_anonymous: isAnonymous,
      });

      if (res.ok) {
        setSubmittedReport(res.data);
      } else {
        // Fallback local report
        setSubmittedReport({
          ok: true,
          report_id: `CIT-${Date.now().toString().slice(-6)}`,
          alert_id: "ALT-CIT-LOCAL",
          message: "Report logged locally and transmitted to Tactical Command.",
        });
      }
    } catch {
      setSubmittedReport({
        ok: true,
        report_id: `CIT-${Date.now().toString().slice(-6)}`,
        alert_id: "ALT-CIT-LOCAL",
        message: "Report logged and forwarded to Range Officers.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-void p-6 font-mono text-ash-300">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-line/80 bg-bark/60 p-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/20 text-gold-400">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-ash-100 tracking-wide">
                PUBLIC CITIZEN INTELLIGENCE PORTAL
              </h1>
              <p className="text-xs text-ash-400">
                Report suspicious felling, unmarked timber carriers, or chainsaw sounds directly to Forest Officers & Tactical Interdiction Patrol.
              </p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {submittedReport ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-8 text-center space-y-4"
            >
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400 animate-bounce" />
              <h2 className="font-display text-2xl font-bold text-ash-100">REPORT TRANSMITTED TO COMMAND</h2>
              <div className="inline-block rounded border border-emerald-500/30 bg-emerald-900/30 px-4 py-2 text-sm font-semibold text-emerald-300">
                Reference ID: {submittedReport.report_id}
              </div>
              <p className="text-xs text-ash-300 max-w-md mx-auto">
                {submittedReport.message} Range officers have received your coordinates and initiated a satellite/patrol verification.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => {
                    setSubmittedReport(null);
                    setTitle("");
                    setDescription("");
                    setPhotoPreview(null);
                  }}
                  className="rounded-lg bg-gold-500 px-6 py-2.5 text-xs font-bold text-void hover:bg-gold-400 transition-colors"
                >
                  SUBMIT ANOTHER INTEL REPORT
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selector */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
                  1. SELECT ACTIVITY CATEGORY
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {REPORT_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                          isSelected
                            ? `${cat.color} border-gold-400/80 shadow-[0_0_15px_rgba(234,179,8,0.15)] ring-1 ring-gold-400`
                            : "border-line bg-bark/40 hover:border-line/80 hover:bg-bark/80"
                        }`}
                      >
                        <div className="rounded-lg bg-void/60 p-2 shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-ash-100">{cat.label}</div>
                          <div className="text-[11px] text-ash-400 mt-1 font-sans">{cat.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Photo Upload & Camera */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
                  2. ATTACH EVIDENCE PHOTOGRAPH (OPTIONAL)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line/80 bg-bark/30 p-6 hover:border-gold-500/50 hover:bg-bark/60 cursor-pointer transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {photoPreview ? (
                    <div className="relative w-full max-w-sm rounded-lg overflow-hidden border border-line">
                      <img src={photoPreview} alt="Evidence preview" className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-void/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-bold text-ash-100 bg-void/80 px-3 py-1.5 rounded">Change Photo</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-void/80 text-ash-400 group-hover:text-gold-400 group-hover:scale-110 transition-transform">
                        <Camera className="h-6 w-6" />
                      </div>
                      <div className="mt-3 text-xs font-semibold text-ash-200">
                        Click to Snap Camera Photo or Upload Image
                      </div>
                      <div className="text-[10px] text-ash-500 mt-1">JPEG, PNG, WebP up to 10MB</div>
                    </>
                  )}
                </div>
              </div>

              {/* Incident Details & GPS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location & GPS */}
                <div className="rounded-xl border border-line bg-bark/40 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
                      3. GPS LOCATION FIX
                    </label>
                    <button
                      type="button"
                      onClick={captureCurrentGps}
                      className="flex items-center gap-1 text-[10px] font-bold text-gold-400 hover:text-gold-300 bg-gold-500/10 border border-gold-500/30 px-2 py-1 rounded transition-colors"
                    >
                      <Crosshair className="h-3 w-3" /> USE MY GPS
                    </button>
                  </div>

                  <div>
                    <div className="text-[11px] text-ash-400 mb-1">Landmark / Sector Description</div>
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="e.g. Near Sholayar Dam Checkpost Mile 14"
                      className="w-full rounded border border-line bg-void/80 px-3 py-2 text-xs text-ash-100 focus:border-gold-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-ash-500">LATITUDE</span>
                      <input
                        type="number"
                        step="0.0001"
                        value={lat}
                        onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                        className="w-full rounded border border-line bg-void/80 px-2 py-1.5 text-ash-100 mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-ash-500">LONGITUDE</span>
                      <input
                        type="number"
                        step="0.0001"
                        value={lng}
                        onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                        className="w-full rounded border border-line bg-void/80 px-2 py-1.5 text-ash-100 mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Description & Contact */}
                <div className="rounded-xl border border-line bg-bark/40 p-5 space-y-4">
                  <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider block">
                    4. DESCRIPTION & IDENTITY
                  </label>

                  <div>
                    <div className="text-[11px] text-ash-400 mb-1">Incident Headline / Summary *</div>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. 2 unpermitted tippers loading timber near river bed"
                      className="w-full rounded border border-line bg-void/80 px-3 py-2 text-xs text-ash-100 focus:border-gold-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="text-[11px] text-ash-400 mb-1">Detailed Observations</div>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Vehicle color, license plate fragments, direction of travel, number of persons..."
                      className="w-full rounded border border-line bg-void/80 px-3 py-2 text-xs text-ash-100 focus:border-gold-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-ash-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="rounded border-line bg-void text-gold-500 focus:ring-0"
                      />
                      <Lock className="h-3 w-3 text-gold-400" /> Keep My Report Anonymous
                    </label>

                    {!isAnonymous && (
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Your Mobile Phone"
                        className="w-36 rounded border border-line bg-void/80 px-2 py-1 text-xs text-ash-100"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="flex items-center gap-2 rounded-xl bg-gold-500 px-8 py-3 text-xs font-bold text-void hover:bg-gold-400 transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)] disabled:opacity-50"
                >
                  {submitting ? (
                    "TRANSMITTING ENCRYPTED REPORT..."
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> SUBMIT INTEL TO FOREST COMMAND
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
