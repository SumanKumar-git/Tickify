import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetAllEventsQuery } from "../api/eventApi";
import { EventCard } from "../components/EventCard";

const CATEGORIES = [
  "Music",
  "Art",
  "Workshop",
  "Seminar",
  "Conference",
  "Comedy",
];

export const BrowseEventsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [available, setAvailable] = useState(
    searchParams.get("available") === "true",
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "latest");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [debouncedCity, setDebouncedCity] = useState(city);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedCity(city), 500);
    return () => clearTimeout(handler);
  }, [city]);

  // Sync URL search params
  useEffect(() => {
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (category) params.category = category;
    if (debouncedCity) params.city = debouncedCity;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (available) params.available = "true";
    if (sort !== "latest") params.sort = sort;
    if (page > 1) params.page = page.toString();

    setSearchParams(params);
  }, [
    debouncedSearch,
    category,
    debouncedCity,
    minPrice,
    maxPrice,
    available,
    sort,
    page,
    setSearchParams,
  ]);

  // Fetch events using RTK query
  const queryParams = {
    search: debouncedSearch || undefined,
    category: category || undefined,
    city: debouncedCity || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    available: available ? "true" : undefined,
    sort,
    page,
    limit: 9,
  };

  const { data, isLoading, isFetching, error } =
    useGetAllEventsQuery(queryParams);
  const events = data?.events || [];
  const pagination = data?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalEvents: 0,
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategory("");
    setCity("");
    setMinPrice("");
    setMaxPrice("");
    setAvailable(false);
    setSort("latest");
    setPage(1);
  };

  return (
    <div className="max-w-360 mx-auto px-6 py-10 w-full grow flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-xl md:text-headline-md font-bold text-on-surface tracking-tight">
            Discover Events
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Explore and book from our curated collection of active events.
          </p>
        </div>

        {/* Sorting selector */}
        <div className="flex items-center gap-2 self-end shrink-0">
          <label className="text-xs text-on-surface-variant font-semibold">
            Sort By
          </label>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
          >
            <option value="latest">Latest Created</option>
            <option value="oldest">Oldest Created</option>
            <option value="date_asc">Event Date Ascending</option>
            <option value="date_desc">Event Date Descending</option>
            <option value="price_asc">Price Low to High</option>
            <option value="price_desc">Price High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start grow">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 bg-surface-container p-6 rounded-xl border border-outline-variant/30 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-outline-variant/20">
            <span className="font-bold text-xs uppercase tracking-widest text-on-surface">
              Filters
            </span>
            <button
              onClick={handleResetFilters}
              className="text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              Clear All
            </button>
          </div>

          {/* Search Term */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface-variant">
              Keywords
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-high text-on-surface text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="Music, Tech, conference..."
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none flex items-center">
                search
              </span>
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface-variant">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-high text-on-surface text-xs focus:ring-1 focus:ring-primary outline-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* City search */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface-variant">
              City Location
            </label>
            <div className="relative">
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-high text-on-surface text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="Mumbai"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none flex items-center">
                location_on
              </span>
            </div>
          </div>

          {/* Pricing Ranges */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-on-surface-variant">
              Price Range (₹)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
                placeholder="Min"
                className="w-1/2 px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-high text-on-surface text-xs focus:ring-1 focus:ring-primary outline-none"
              />
              <span className="text-outline text-xs">-</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
                placeholder="Max"
                className="w-1/2 px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-high text-on-surface text-xs focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          {/* Availability checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="availCheckbox"
              checked={available}
              onChange={(e) => {
                setAvailable(e.target.checked);
                setPage(1);
              }}
              className="w-4 h-4 rounded text-primary focus:ring-primary/30 bg-surface-container-high border-outline-variant/50 accent-primary"
            />
            <label
              htmlFor="availCheckbox"
              className="text-xs font-semibold text-on-surface-variant select-none cursor-pointer"
            >
              Show Available Seats Only
            </label>
          </div>
        </aside>

        {/* Grid List */}
        <section className="lg:col-span-3 flex flex-col justify-between grow min-h-125">
          {isLoading || (isFetching && events.length === 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/20 h-96 animate-pulse"
                >
                  <div className="h-44 bg-surface-container-high"></div>
                  <div className="p-5 space-y-4">
                    <div className="w-1/4 h-3 bg-surface-container-highest rounded"></div>
                    <div className="w-3/4 h-4 bg-surface-container-highest rounded"></div>
                    <div className="w-1/2 h-3 bg-surface-container-highest rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="grow flex flex-col items-center justify-center p-12 bg-surface-container/10 border border-outline-variant/20 rounded-xl">
              <span className="material-symbols-outlined text-4xl text-error mb-2">
                error_outline
              </span>
              <p className="text-sm font-semibold text-on-surface">
                Error Fetching Events
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                {error.data?.message || "Something went wrong on the server."}
              </p>
            </div>
          ) : events.length === 0 ? (
            <div className="grow flex flex-col items-center justify-center p-16 bg-surface-container/15 border border-outline-variant/25 rounded-xl">
              <span className="material-symbols-outlined text-5xl text-outline opacity-40 mb-3">
                search_off
              </span>
              <p className="text-sm font-bold text-on-surface">
                No Events Found
              </p>
              <p className="text-xs text-on-surface-variant mt-1 max-w-xs text-center">
                We couldn't find any events matching your selected criteria. Try
                adjusting or clearing your filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-6 bg-primary text-on-primary text-xs font-bold px-5 py-2.5 rounded-lg active:scale-95 transition-all shadow cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {/* Event Listings */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
                {events.map((evt) => (
                  <EventCard key={evt._id} event={evt} />
                ))}
              </div>

              {/* Pagination controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 border-t border-outline-variant/15 pt-6 mt-auto">
                  <button
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_left
                    </span>
                  </button>
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Page{" "}
                    <span className="text-on-surface font-bold">
                      {pagination.currentPage}
                    </span>{" "}
                    of{" "}
                    <span className="text-on-surface font-bold">
                      {pagination.totalPages}
                    </span>
                  </span>
                  <button
                    disabled={page >= pagination.totalPages || isFetching}
                    onClick={() =>
                      setPage((p) => Math.min(p + 1, pagination.totalPages))
                    }
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_right
                    </span>
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default BrowseEventsPage;
