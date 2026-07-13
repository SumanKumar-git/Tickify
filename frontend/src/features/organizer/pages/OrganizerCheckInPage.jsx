import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Html5Qrcode } from "html5-qrcode";
import { useGetEventByIdForOrganizerQuery } from "../../events/api/eventApi";
import { useCheckInTicketMutation } from "../../tickets/api/ticketApi";

export const OrganizerCheckInPage = () => {
  const { id } = useParams();

  // Fetch Event details
  const { data: eventData, isLoading: isEventLoading, error: eventError } = useGetEventByIdForOrganizerQuery(id);
  const event = eventData?.event;

  const [checkInTicket, { isLoading: isCheckingIn }] = useCheckInTicketMutation();

  const scannerRef = useRef(null);
  const [cameraId, setCameraId] = useState("");
  const [cameras, setCameras] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [manualPayload, setManualPayload] = useState("");

  const [timeState, setTimeState] = useState({
    now: new Date(),
    allowedStart: null,
    allowedEnd: null,
    isTooEarly: false,
    isEnded: false,
    isCheckInOpen: false,
  });

  // Calculate Check-In Times
  useEffect(() => {
    if (!event) return;

    const updateCheckInTimeState = () => {
      const now = new Date();
      const allowedStart = new Date(new Date(event.startDate).getTime() - 60 * 60 * 1000);
      const allowedEnd = new Date(event.endDate);

      setTimeState({
        now,
        allowedStart,
        allowedEnd,
        isTooEarly: now < allowedStart,
        isEnded: now > allowedEnd,
        isCheckInOpen: now >= allowedStart && now <= allowedEnd,
      });
    };

    updateCheckInTimeState();
    const interval = setInterval(updateCheckInTimeState, 15000); // refresh time status every 15s

    return () => clearInterval(interval);
  }, [event]);

  // Request cameras list
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          setCameraId(devices[0].id);
        }
      })
      .catch((err) => {
        console.error("Failed to get cameras", err);
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch((e) => console.error("Error stopping scanner on unmount", e));
      }
    };
  }, []);

  const startScanning = async () => {
    if (!cameraId) {
      toast.error("No camera device selected");
      return;
    }
    setScanResult(null);

    const html5Qrcode = new Html5Qrcode("reader-container-id");
    scannerRef.current = html5Qrcode;

    try {
      await html5Qrcode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          setIsScanning(false);
          await html5Qrcode.stop();
          scannerRef.current = null;
          handleProcessCheckIn(decodedText);
        },
        () => {
          // ignore scan noise
        }
      );
      setIsScanning(true);
    } catch (err) {
      toast.error("Failed to start scanner: " + err.message);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error("Stop scanning error", err);
      }
    }
  };

  const handleProcessCheckIn = async (payload) => {
    try {
      const res = await checkInTicket({ eventId: id, qrPayload: payload }).unwrap();
      setScanResult({
        success: true,
        message: res.message || "Ticket checked in successfully!",
        guestName: res.ticket?.user?.fullName || "Guest",
        guestEmail: res.ticket?.user?.email,
        ticketNumber: res.ticket?.ticketNumber,
        checkedInAt: res.ticket?.checkedInAt || new Date().toISOString(),
      });
      toast.success("Check-in Verified!");
    } catch (err) {
      setScanResult({
        success: false,
        message: err.data?.message || "Invalid ticket signature or check-in validation error.",
      });
      toast.error("Check-in Failed");
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualPayload.trim()) {
      toast.error("Please enter a ticket payload signature");
      return;
    }
    stopScanning();
    handleProcessCheckIn(manualPayload.trim());
    setManualPayload("");
  };

  if (isEventLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 w-full grow animate-pulse space-y-6">
        <div className="h-6 bg-surface-container w-1/4 rounded"></div>
        <div className="h-80 bg-surface-container rounded-2xl"></div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-surface-container border border-outline-variant/30 rounded-xl text-center shadow-xl">
        <span className="material-symbols-outlined text-4xl text-error mb-2">error</span>
        <h2 className="text-md font-bold text-on-surface">Event Not Found</h2>
        <p className="text-xs text-on-surface-variant mt-2">Could not retrieve event info for check-in.</p>
        <Link
          to="/organizer/events"
          className="mt-6 inline-block bg-primary text-on-primary text-xs font-bold px-6 py-2.5 rounded-lg active:scale-95 transition-all cursor-pointer"
        >
          Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 w-full grow flex flex-col gap-6">
      <style>{`
        @keyframes scan-glow {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .scanner-glow-line {
          animation: scan-glow 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* Header breadcrumbs */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-outline tracking-wider">
          <Link to="/organizer/events" className="hover:text-primary transition-colors">Events</Link>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <Link to={`/organizer/events/${id}`} className="hover:text-primary transition-colors">{event.title}</Link>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="text-on-surface-variant">Live Scanner</span>
        </div>
        <h1 className="text-xl md:text-headline-md font-black text-on-surface tracking-tight mt-1">Ticket Check-In</h1>
      </div>

      {/* Dynamic Status Alert Banner */}
      <div className="w-full">
        {timeState.isTooEarly && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300 rounded-2xl flex gap-3 text-xs">
            <span className="material-symbols-outlined text-[20px] shrink-0">info</span>
            <div>
              <p className="font-bold">Check-In Opens 1 Hour Prior to Event Start Time</p>
              <p className="mt-1 opacity-90 leading-relaxed">
                Check-in will activate on <strong>{timeState.allowedStart?.toLocaleString()}</strong>. Standard tickets cannot be scanned before this window.
              </p>
            </div>
          </div>
        )}

        {timeState.isEnded && (
          <div className="p-4 bg-error/10 border border-error/20 text-error rounded-2xl flex gap-3 text-xs">
            <span className="material-symbols-outlined text-[20px] shrink-0">cancel</span>
            <div>
              <p className="font-bold">Check-In Closed</p>
              <p className="mt-1 opacity-90 leading-relaxed">
                This event ended on <strong>{timeState.allowedEnd?.toLocaleString()}</strong>. Check-in operations are inactive.
              </p>
            </div>
          </div>
        )}

        {timeState.isCheckInOpen && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 rounded-2xl flex gap-3 text-xs">
            <span className="material-symbols-outlined text-[20px] shrink-0">task_alt</span>
            <div>
              <p className="font-bold">Check-In Active</p>
              <p className="mt-1 opacity-90 leading-relaxed">
                Check-in is active until event ends at <strong>{timeState.allowedEnd?.toLocaleString()}</strong>. Ready to accept scanning.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-2">
        {/* Scanner Stream Box (8 cols) */}
        <div className="lg:col-span-8 bg-surface-container border border-outline-variant/30 rounded-3xl p-6 shadow-xl flex flex-col gap-6 items-center">
          
          <div className="w-full flex justify-between items-center pb-4 border-b border-outline-variant/20">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Camera Stream</h3>
            {isScanning && (
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Scanning Active
              </span>
            )}
          </div>

          {/* Reader container */}
          <div className="relative aspect-video w-full bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/35 flex items-center justify-center shadow-inner">
            {isScanning && (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-40 sm:w-52 sm:h-52 border-2 border-primary/60 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                  {/* Glowing line animation */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_#381e72] scanner-glow-line"></div>
                  {/* Corner brackets */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl"></div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr"></div>
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl"></div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br"></div>
                </div>
              </div>
            )}
            
            {/* The scanning container html5-qrcode binds to */}
            <div id="reader-container-id" className="w-full h-full object-cover"></div>

            {/* Display message if not scanning */}
            {!isScanning && !scanResult && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-zinc-400 gap-3">
                <span className="material-symbols-outlined text-4xl opacity-35">videocam_off</span>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-300">Camera is turned off</p>
                  <p className="text-[10px] text-zinc-500 max-w-55 mx-auto leading-relaxed">
                    Select a camera device and tap "Start Scanner" to begin validating entry tickets.
                  </p>
                </div>
              </div>
            )}

            {/* Display loader if checking in */}
            {isCheckingIn && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 z-25 text-white gap-2">
                <span className="material-symbols-outlined text-3xl animate-spin text-primary">sync</span>
                <p className="text-xs font-bold font-display">Verifying ticket signature...</p>
              </div>
            )}

            {/* Scanning Result Overlay */}
            {scanResult && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 z-20 text-white">
                {scanResult.success ? (
                  <div className="space-y-4 max-w-sm flex flex-col items-center">
                    <span className="material-symbols-outlined text-5xl text-emerald-500 animate-bounce">check_circle</span>
                    <div>
                      <h3 className="text-sm font-black uppercase text-emerald-400 tracking-wider">Check-In Successful!</h3>
                      <p className="text-md font-extrabold text-white mt-1 leading-snug">{scanResult.guestName}</p>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{scanResult.guestEmail}</p>
                    </div>

                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl w-full text-[10px] text-zinc-400 space-y-1 font-mono text-left">
                      <p><span className="text-zinc-500 font-sans">Ticket No:</span> #{scanResult.ticketNumber}</p>
                      <p>
                        <span className="text-zinc-500 font-sans">Time:</span> {new Date(scanResult.checkedInAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-sm flex flex-col items-center">
                    <span className="material-symbols-outlined text-5xl text-error animate-pulse">cancel</span>
                    <div>
                      <h3 className="text-sm font-black uppercase text-error tracking-wider">Validation Failed</h3>
                      <p className="text-xs text-zinc-300 mt-2 leading-relaxed font-medium">
                        {scanResult.message}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setScanResult(null);
                    startScanning();
                  }}
                  disabled={!timeState.isCheckInOpen}
                  className="mt-6 bg-primary text-on-primary text-xs font-bold px-6 py-2.5 rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                  <span>Scan Next Ticket</span>
                </button>
              </div>
            )}
          </div>

          {/* Control Triggers */}
          <div className="w-full flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between mt-2">
            {/* Camera Select */}
            <div className="w-full sm:w-1/2 flex flex-col gap-2">
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Select Device Camera</label>
              <select
                value={cameraId}
                onChange={(e) => setCameraId(e.target.value)}
                disabled={isScanning || cameras.length === 0}
                className="w-full px-3 py-2 bg-surface-container-high border border-outline-variant/40 rounded-lg text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-60"
              >
                {cameras.length === 0 ? (
                  <option>No Camera Detected</option>
                ) : (
                  cameras.map((cam) => (
                    <option key={cam.id} value={cam.id}>
                      {cam.label || `Camera ${cam.id}`}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Scanner buttons */}
            <div className="flex gap-3 shrink-0 w-full sm:w-auto justify-end">
              {isScanning ? (
                <button
                  onClick={stopScanning}
                  className="px-6 py-2.5 bg-error text-on-error hover:opacity-90 active:scale-95 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">videocam_off</span>
                  Stop Scanner
                </button>
              ) : (
                <button
                  onClick={startScanning}
                  disabled={!timeState.isCheckInOpen || cameras.length === 0}
                  className="px-6 py-2.5 bg-primary text-on-primary hover:opacity-90 active:scale-95 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">videocam</span>
                  Start Scanner
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Manual entry card (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container border border-outline-variant/30 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="pb-4 border-b border-outline-variant/20">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Manual Lookup</h3>
              <p className="text-[10px] text-on-surface-variant mt-1 leading-snug">
                Fallback verification if ticket QR fails to scan.
              </p>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant">Signature Payload</label>
                <textarea
                  value={manualPayload}
                  onChange={(e) => setManualPayload(e.target.value)}
                  disabled={!timeState.isCheckInOpen}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-high text-xs text-on-surface placeholder:text-outline/40 focus:ring-1 focus:ring-primary outline-none transition-all resize-none disabled:opacity-60"
                  placeholder="Paste cryptographic QR payload signature..."
                />
              </div>

              <button
                type="submit"
                disabled={isCheckingIn || !timeState.isCheckInOpen || !manualPayload.trim()}
                className="w-full py-2.5 bg-primary text-on-primary rounded-lg text-xs font-bold shadow hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">vpn_key</span>
                <span>Verify Signature</span>
              </button>
            </form>
          </div>

          {/* Quick instructions card */}
          <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px]">assignment_turned_in</span>
              <span>Scanning Guidelines</span>
            </div>
            <ul className="list-disc pl-4 text-[10px] text-on-surface-variant space-y-2 leading-relaxed font-medium">
              <li>Position the QR code inside the central square area.</li>
              <li>Make sure the ticket belongs to <strong>{event.title}</strong>.</li>
              <li>Once successfully verified, the camera will auto-pause. Tap "Scan Next" to resume.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerCheckInPage;
