import dns from "node:dns";

// Set Node.js to resolve IPv4 first by default
dns.setDefaultResultOrder("ipv4first");

const disableIPv6 = (hostname, options, callback) => {
    const cb = typeof options === "function" ? options : callback;
    const err = new Error("ENODATA");
    err.code = "ENODATA";
    cb(err);
};

dns.resolve6 = disableIPv6;

if (dns.Resolver && dns.Resolver.prototype) {
    dns.Resolver.prototype.resolve6 = disableIPv6;
}
