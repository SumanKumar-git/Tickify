import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../auth/authSlice";
import { toast } from "react-hot-toast";
import { useGetTicketByIdQuery, useGetTicketQrPayloadQuery } from "../api/ticketApi";
import {toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";

const formatISTDateTime = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { date: "", time: "", weekday: "" };

  const weekday = date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long" });
  const dateStrFormatted = date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });

  return { date: dateStrFormatted, time: timeStr, weekday };
};

export const TicketDetailsPage = () => {
  const { ticketId } = useParams();
  const user = useSelector(selectCurrentUser);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDarkTicket, setIsDarkTicket] = useState(true);

  // Fetch ticket details
  const { data: ticketData, isLoading: isTicketLoading, error: ticketError } = useGetTicketByIdQuery(ticketId);
  const ticket = ticketData?.ticket;

  // Fetch QR payload (only if active)
  const { data: qrData, isLoading: isQrLoading } = useGetTicketQrPayloadQuery(ticketId, {
    skip: !ticket || ticket.ticketStatus !== "active",
  });
  const qrPayload = qrData?.qrPayload || "";

  if (isTicketLoading) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 w-full grow animate-pulse space-y-6">
        <div className="h-112.5 bg-surface-container rounded-3xl"></div>
      </div>
    );
  }

  if (ticketError || !ticket) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-surface-container border border-outline-variant/30 rounded-xl text-center shadow-xl">
        <span className="material-symbols-outlined text-4xl text-error mb-2">local_activity</span>
        <h2 className="text-md font-bold text-on-surface">Ticket Not Found</h2>
        <p className="text-xs text-on-surface-variant mt-2">
          {ticketError?.data?.message || "Could not retrieve the entry ticket."}
        </p>
        <Link
          to="/tickets"
          className="mt-6 inline-block bg-primary text-on-primary text-xs font-bold px-6 py-2.5 rounded-lg active:scale-95 transition-all cursor-pointer"
        >
          Back to My Tickets
        </Link>
      </div>
    );
  }

  const event = ticket.event || {};
  const booking = ticket.booking || {};
  const venue = event.venue || {};
  const isActive = ticket.ticketStatus === "active";
  const isUsed = ticket.ticketStatus === "used";

  const { date: istDate, time: istTime, weekday: istWeekday } = formatISTDateTime(event.startDate);
  
  // Construct the full location address details
  const fullAddress = [venue.address, venue.city, venue.state, venue.country]
    .filter(Boolean)
    .join(", ");
  const attendeeName = user?.fullName || "Participant";

  const handleDownloadPdf = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    const toastId = toast.loading("Generating your PDF ticket...");
    try {
      const element = document.getElementById("ticket-card-element");
      if (!element) throw new Error("Ticket card element not found");

      // Render crisp image from DOM using html-to-image (bypasses all oklab/oklch parser bugs)
      const imgData = await toJpeg(element, {
        pixelRatio: 3,
        quality: 0.95,
      });

      // Create PDF in pixels (1:1 with card size)
      const pdf = new jsPDF({
        orientation: "p",
        unit: "px",
        format: [element.offsetWidth, element.offsetHeight],
      });

      pdf.addImage(imgData, "PNG", 0, 0, element.offsetWidth, element.offsetHeight);
      pdf.save(`Tickify-Ticket-${ticket.ticketNumber || ticketId}.pdf`);
      
      toast.success("Ticket PDF downloaded successfully!", { id: toastId });
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error(err.message || "Failed to download ticket PDF", { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-10 w-full grow flex flex-col items-center justify-center gap-6 relative">
      
      {/* Theme Toggle Button - Floating on the left most of the screen */}
      <div className="fixed left-4 bottom-6 md:left-6 md:top-1/2 md:-translate-y-1/2 md:bottom-auto z-50">
        <button
          onClick={() => setIsDarkTicket(!isDarkTicket)}
          className="flex items-center justify-center gap-2 p-3.5 rounded-full border border-outline-variant/30 bg-surface-container-low text-xs font-bold text-on-surface hover:bg-surface-container-high hover:border-primary/50 active:scale-95 transition-all cursor-pointer shadow-2xl md:flex-col md:w-16 md:h-16 md:rounded-2xl"
          title={isDarkTicket ? "Switch to White Theme" : "Switch to Dark Theme"}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isDarkTicket ? "light_mode" : "dark_mode"}
          </span>
          <span className="text-[9px] uppercase tracking-wider hidden md:block leading-none mt-1">{isDarkTicket ? "Light" : "Dark"}</span>
        </button>
      </div>

      {/* High Fidelity Premium Ticket Card (to be captured for PDF) */}
      <div 
        id="ticket-card-element"
        className={`w-full border rounded-3xl overflow-hidden shadow-2xl relative transition-all duration-300 hover:shadow-primary/5 hover:border-primary/20 ${
          isDarkTicket 
            ? "border-zinc-800 bg-linear-to-b from-[#201f22] to-[#1c1b1d]" 
            : "border-zinc-200 bg-linear-to-b from-white to-zinc-50"
        }`}
      >
        
        {/* Banner strip */}
        <div className={`h-48 relative border-b ${isDarkTicket ? "bg-[#2a2a2c] border-zinc-800/40" : "bg-[#1c1b1d] border-zinc-200/40"}`}>
          {event.poster ? (
            <img 
              alt={event.title} 
              className="w-full h-full object-cover opacity-85 transition-transform duration-500 hover:scale-102" 
              src={event.poster} 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-outline">
              <span className="material-symbols-outlined text-4xl">image</span>
            </div>
          )}
          {/* Subtle gradient overlay */}
          <div 
            className="absolute inset-0"
            style={{ 
              backgroundImage: "linear-gradient(to top, #1c1b1d 0%, rgba(28, 27, 29, 0.4) 50%, rgba(0, 0, 0, 0.45) 100%)"
            }}
          ></div>
          
          <div className="absolute top-4 right-4 z-10">
            <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border backdrop-blur-sm ${
              isActive
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                : isUsed
                ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                : "bg-error/10 text-error border-error/20"
            }`}>
              {ticket.ticketStatus}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-left">
            <span className="bg-primary/25 border border-primary/30 backdrop-blur-md px-2.5 py-0.5 rounded text-[8px] font-bold text-primary uppercase tracking-wider">
              {event.category}
            </span>
            <h1 className="text-lg font-black mt-1.5 leading-snug drop-shadow-md line-clamp-2 text-white">{event.title}</h1>
          </div>
        </div>

        {/* Perforated separator with inset shadows */}
        <div className="relative flex items-center my-3 py-1">
          <div className={`absolute -left-3 w-6 h-6 rounded-full bg-background border-r ${isDarkTicket ? "border-zinc-800 shadow-[inset_-3px_0_4px_rgba(0,0,0,0.5)]" : "border-zinc-200 shadow-[inset_-3px_0_4px_rgba(0,0,0,0.1)]"} z-10`}></div>
          <div className={`w-full border-t-2 border-dashed mx-4 ${isDarkTicket ? "border-zinc-800/40" : "border-zinc-200/80"}`}></div>
          <div className={`absolute -right-3 w-6 h-6 rounded-full bg-background border-l ${isDarkTicket ? "border-zinc-800 shadow-[inset_3px_0_4px_rgba(0,0,0,0.5)]" : "border-zinc-200 shadow-[inset_3px_0_4px_rgba(0,0,0,0.1)]"} z-10`}></div>
        </div>

        {/* QR Section */}
        <div className="px-6 pb-6 pt-2 flex flex-col items-center justify-center text-center space-y-6">
          <div className="text-center">
            <p className={`text-[10px] tracking-[0.2em] font-mono font-bold uppercase ${isDarkTicket ? "text-zinc-400" : "text-zinc-500"}`}>
              VOUCHER NO: {ticket.ticketNumber}
            </p>
            <p className={`text-[9px] font-medium mt-0.5 ${isDarkTicket ? "text-zinc-400" : "text-zinc-700"}`}>
              Sequence: {ticket.ticketSequence} of {booking.quantity || 1}
            </p>
          </div>

          {/* Render QR code */}
          <div className={`relative p-5 bg-white rounded-xl shadow-xl border ${isDarkTicket ? "border-zinc-800/40" : "border-zinc-200/60"}`}>
            {/* Scanning Corner Crosshairs */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary-container"></div>
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary-container"></div>
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary-container"></div>
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary-container"></div>
            
            {isActive ? (
              isQrLoading ? (
                <div className="w-40 h-40 flex items-center justify-center bg-surface-container rounded-lg">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                </div>
              ) : (
                <QRCodeSVG
                  value={qrPayload}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="H"
                  marginSize={0}
                />
              )
            ) : isUsed ? (
              <div className={`w-40 h-40 flex flex-col items-center justify-center rounded-lg border text-on-surface-variant font-medium ${isDarkTicket ? "bg-[#201f22] border-zinc-800/40" : "bg-zinc-50 border-zinc-200"}`}>
                <span className="material-symbols-outlined text-4xl text-emerald-600 mb-1.5 animate-pulse">check_circle</span>
                <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Checked In</p>
                {ticket.checkedInAt && (
                  <p className="text-[9px] text-zinc-500 mt-1 font-mono">
                    {new Date(ticket.checkedInAt).toLocaleTimeString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })} (IST)
                  </p>
                )}
              </div>
            ) : (
              <div className={`w-40 h-40 flex flex-col items-center justify-center rounded-lg border text-on-surface-variant font-medium ${isDarkTicket ? "bg-[#201f22] border-zinc-800/40" : "bg-zinc-50 border-zinc-200"}`}>
                <span className="material-symbols-outlined text-4xl text-error mb-1.5">block</span>
                <p className="text-[10px] uppercase font-bold text-error tracking-wider">Voucher Invalid</p>
              </div>
            )}
          </div>

          {/* Quick Details Table */}
          <div className={`w-full text-left p-5 rounded-2xl border space-y-4 ${
            isDarkTicket 
              ? "bg-[#201f22]/60 border-zinc-800/40" 
              : "bg-zinc-50/85 border-zinc-200/80"
          }`}>
            
            {/* Date & Time Section */}
            <div className="flex gap-3">
              <span className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${isDarkTicket ? "text-[#c0c1ff]" : "text-[#5055b1]"}`}>calendar_today</span>
              <div className="space-y-0.5">
                <p className={`text-[8px] font-semibold uppercase tracking-wider ${isDarkTicket ? "text-zinc-400" : "text-zinc-500"}`}>Date & Time (IST)</p>
                <p className={`text-[11px] font-bold leading-tight ${isDarkTicket ? "text-white" : "text-zinc-900"}`}>
                  {istWeekday}, {istDate}
                </p>
                <p className={`text-[10px] font-semibold leading-none ${isDarkTicket ? "text-zinc-400" : "text-zinc-700"}`}>
                  {istTime}
                </p>
              </div>
            </div>

            {/* Location Section */}
            <div className="flex gap-3">
              <span className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${isDarkTicket ? "text-[#c0c1ff]" : "text-[#5055b1]"}`}>location_on</span>
              <div className="space-y-0.5">
                <p className={`text-[8px] font-semibold uppercase tracking-wider ${isDarkTicket ? "text-zinc-400" : "text-zinc-500"}`}>Venue Location</p>
                <p className={`text-[11px] font-bold leading-tight ${isDarkTicket ? "text-white" : "text-zinc-900"}`}>
                  {venue.name || "Online/TBD"}
                </p>
                {fullAddress && (
                  <p className={`text-[10px] font-semibold leading-normal text-xs ${isDarkTicket ? "text-zinc-400" : "text-zinc-700"}`}>
                    {fullAddress}
                  </p>
                )}
              </div>
            </div>

            {/* Price Section */}
            <div className={`flex gap-3 border-t pt-3 ${isDarkTicket ? "border-zinc-800" : "border-zinc-200/60"}`}>
              <span className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${isDarkTicket ? "text-[#c0c1ff]" : "text-[#5055b1]"}`}>payments</span>
              <div className="space-y-0.5">
                <p className={`text-[8px] font-semibold uppercase tracking-wider ${isDarkTicket ? "text-zinc-400" : "text-zinc-500"}`}>Ticket Price</p>
                <p className={`text-[11px] font-bold leading-tight ${isDarkTicket ? "text-white" : "text-zinc-900"}`}>
                  {event.ticketPrice > 0 ? `₹${event.ticketPrice.toLocaleString()} per ticket` : "Free Admission"}
                </p>
                {booking.totalAmount && (
                  <p className={`text-[10px] font-semibold leading-none ${isDarkTicket ? "text-[#c0c1ff]" : "text-[#5055b1]"}`}>
                    Total Paid: ₹{booking.totalAmount.toLocaleString()} ({booking.quantity} tickets)
                  </p>
                )}
              </div>
            </div>

            {/* Attendee details */}
            <div className={`flex gap-3 border-t pt-3 ${isDarkTicket ? "border-zinc-800" : "border-zinc-200/60"}`}>
              <span className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${isDarkTicket ? "text-[#c0c1ff]" : "text-[#5055b1]"}`}>account_circle</span>
              <div className="space-y-0.5">
                <p className={`text-[8px] font-semibold uppercase tracking-wider ${isDarkTicket ? "text-zinc-400" : "text-zinc-500"}`}>Attendee & Order Info</p>
                <p className={`text-[11px] font-bold leading-tight ${isDarkTicket ? "text-white" : "text-zinc-900"}`}>
                  {attendeeName}
                </p>
                <p className={`text-[10px] font-semibold font-mono uppercase tracking-wide leading-none ${isDarkTicket ? "text-zinc-400" : "text-zinc-700"}`}>
                  Order ID: #{booking._id?.toUpperCase()}
                </p>
              </div>
            </div>

          </div>

          <p className={`text-[10px] max-w-75 leading-relaxed ${isDarkTicket ? "text-zinc-400" : "text-zinc-700"}`}>
            Please present this digital code to the coordinator at the entrance gate for scanner validation.
          </p>
        </div>
      </div>

      {/* Download Action Trigger (kept outside the ticket-card-element) */}
      {booking._id && booking.bookingStatus === "confirmed" && (
        <button
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all py-3.5 rounded-2xl font-bold shadow-md text-xs cursor-pointer"
        >
          {isDownloading ? (
            <>
              <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Download PDF Ticket</span>
            </>
          )}
        </button>
      )}

      <Link
        to="/tickets"
        className="mt-2 flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to My Tickets
      </Link>
    </div>
  );
};

export default TicketDetailsPage;
