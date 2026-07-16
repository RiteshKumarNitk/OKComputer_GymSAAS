import React, { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { leadAgentApi } from "@/api/apiClient"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  MapPin,
  Star,
  Globe,
  Phone,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Store,
  Import,
} from "lucide-react"
import type { ScrapedGym, ScrapeResult } from "@/types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const LeadGeneratorDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [city, setCity] = useState("")
  const [result, setResult] = useState<ScrapeResult | null>(null)
  const [selectedGyms, setSelectedGyms] = useState<Set<string>>(new Set())
  const [importedCount, setImportedCount] = useState(0)

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: (cityName: string) => leadAgentApi.search(cityName),
    onSuccess: (response) => {
      if (response.error) {
        toast({ title: "Search failed", description: response.error.message, variant: "destructive" })
        return
      }
      if (response.data) {
        const scrapeResult = response.data as ScrapeResult
        setResult(scrapeResult)
        // Auto-select all hot + warm
        const autoSelected = new Set<string>()
        scrapeResult.gyms.forEach((g) => {
          if (g.priority === "hot" || g.priority === "warm") {
            autoSelected.add(g.placeId)
          }
        })
        setSelectedGyms(autoSelected)
        setImportedCount(0)
        toast({
          title: `Found ${scrapeResult.total} gyms in ${scrapeResult.city}`,
          description: `${scrapeResult.summary.hot} hot, ${scrapeResult.summary.warm} warm, ${scrapeResult.summary.cold} cold`,
        })
      }
    },
    onError: (err: any) => {
      toast({ title: "Search failed", description: err.message, variant: "destructive" })
    },
  })

  // Import mutation
  const importMutation = useMutation({
    mutationFn: (gyms: ScrapedGym[]) =>
      leadAgentApi.importLeads(gyms, city || "Unknown"),
    onSuccess: (response) => {
      if (response.error) {
        toast({ title: "Import failed", description: response.error.message, variant: "destructive" })
        return
      }
      if (response.data) {
        setImportedCount(response.data.imported || 0)
        queryClient.invalidateQueries({ queryKey: ["leads"] })
        toast({
          title: `Imported ${response.data.imported} leads`,
          description: response.data.skipped > 0 ? `${response.data.skipped} duplicates skipped` : undefined,
        })
      }
    },
    onError: (err: any) => {
      toast({ title: "Import failed", description: err.message, variant: "destructive" })
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!city.trim()) return
    setResult(null)
    setSelectedGyms(new Set())
    setImportedCount(0)
    searchMutation.mutate(city.trim())
  }

  const handleImport = () => {
    if (!result) return
    const selected = result.gyms.filter((g) => selectedGyms.has(g.placeId))
    if (selected.length === 0) {
      toast({ title: "No gyms selected", description: "Select at least one gym to import", variant: "destructive" })
      return
    }
    importMutation.mutate(selected)
  }

  const toggleGym = (placeId: string) => {
    setSelectedGyms((prev) => {
      const next = new Set(prev)
      if (next.has(placeId)) next.delete(placeId)
      else next.add(placeId)
      return next
    })
  }

  const selectAll = () => {
    if (!result) return
    setSelectedGyms(new Set(result.gyms.map((g) => g.placeId)))
  }

  const deselectAll = () => {
    setSelectedGyms(new Set())
  }

  const priorityColor = (p: string) => {
    switch (p) {
      case "hot": return "bg-red-100 text-red-700 border-red-200"
      case "warm": return "bg-orange-100 text-orange-700 border-orange-200"
      case "cold": return "bg-blue-100 text-blue-700 border-blue-200"
      default: return "bg-slate-100 text-slate-700"
    }
  }

  const scoreColor = (score: number) => {
    if (score >= 61) return "text-green-600"
    if (score >= 31) return "text-orange-500"
    return "text-slate-400"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">B2B Lead Generator</DialogTitle>
                <DialogDescription className="text-slate-400 text-sm mt-0.5">
                  Discover gyms near any city and import them as qualified leads
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                className="pl-10 h-12 rounded-xl border-slate-200 bg-white text-base font-medium focus-visible:ring-2 focus-visible:ring-emerald-500/20"
                placeholder="Enter a city, e.g. Mumbai, Delhi, Bangalore..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={searchMutation.isPending || !city.trim()}
              className="h-12 px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/20"
            >
              {searchMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              <span className="ml-2">{searchMutation.isPending ? "Searching..." : "Find Gyms"}</span>
            </Button>
          </form>

          {/* API Key Guidance */}
          {!result && !searchMutation.isPending && !searchMutation.isError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-bold mb-1">Prerequisite: Google Places API Key</p>
                <p>
                  This feature uses the Google Places API to search for gyms. Add{" "}
                  <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">GOOGLE_PLACES_API_KEY</code>{" "}
                  to your <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">.env</code> file.
                  Get a key at{" "}
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="underline font-medium">
                    Google Cloud Console
                  </a>.
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              {/* Summary Bar */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                    <Store className="h-3.5 w-3.5" /> Total
                  </div>
                  <span className="text-2xl font-bold text-slate-800">{result.total}</span>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-wider mb-1">
                    <TrendingUp className="h-3.5 w-3.5" /> Hot
                  </div>
                  <span className="text-2xl font-bold text-red-600">{result.summary.hot}</span>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <div className="flex items-center gap-2 text-orange-500 text-xs font-bold uppercase tracking-wider mb-1">
                    <TrendingUp className="h-3.5 w-3.5" /> Warm
                  </div>
                  <span className="text-2xl font-bold text-orange-600">{result.summary.warm}</span>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-500 text-xs font-bold uppercase tracking-wider mb-1">
                    <TrendingUp className="h-3.5 w-3.5" /> Cold
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{result.summary.cold}</span>
                </div>
              </div>

              {/* Selection Actions + Import */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll} className="rounded-lg text-xs font-bold h-8">
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll} className="rounded-lg text-xs font-bold h-8">
                    Deselect All
                  </Button>
                  <span className="text-sm font-bold text-slate-500 ml-2">
                    {selectedGyms.size} of {result.gyms.length} selected
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {importedCount > 0 && (
                    <span className="text-sm text-green-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> {importedCount} imported
                    </span>
                  )}
                  <Button
                    onClick={handleImport}
                    disabled={importMutation.isPending || selectedGyms.size === 0}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl px-6 font-bold shadow-lg shadow-emerald-500/20"
                  >
                    {importMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Import className="h-4 w-4 mr-2" />
                    )}
                    Import {selectedGyms.size > 0 ? `(${selectedGyms.size})` : ""} as Leads
                  </Button>
                </div>
              </div>

              {/* Gym List */}
              <ScrollArea className="h-[350px] rounded-xl border border-slate-200">
                <div className="divide-y divide-slate-100">
                  {result.gyms.map((gym) => {
                    const isSelected = selectedGyms.has(gym.placeId)
                    return (
                      <div
                        key={gym.placeId}
                        onClick={() => toggleGym(gym.placeId)}
                        className={`flex items-start gap-4 p-4 cursor-pointer transition-all ${
                          isSelected
                            ? "bg-emerald-50/50 hover:bg-emerald-100/50 border-l-4 border-emerald-500"
                            : "hover:bg-slate-50 border-l-4 border-transparent"
                        }`}
                      >
                        {/* Checkbox */}
                        <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-slate-300"
                        }`}>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-800 truncate">{gym.name}</span>
                            <Badge className={`${priorityColor(gym.priority)} text-[10px] font-bold px-2 py-0.5 rounded-lg border`}>
                              {gym.priority.toUpperCase()}
                            </Badge>
                            <span className={`text-xs font-bold ${scoreColor(gym.qualityScore)}`}>
                              Score: {gym.qualityScore}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mb-2">{gym.address}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                            {gym.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {gym.phone}
                              </span>
                            )}
                            {gym.rating && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-amber-400" /> {gym.rating}/5
                                {gym.ratingCount && <span>({gym.ratingCount})</span>}
                              </span>
                            )}
                            {gym.website && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3 text-blue-400" /> Website
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Error State */}
          {searchMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-bold mb-1">Search failed</p>
                <p>{(searchMutation.error as any)?.message || "An unexpected error occurred. Check your Google Places API key."}</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {result && result.total === 0 && (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-bold">No gyms found in "{result.city}"</p>
              <p className="text-slate-400 text-sm mt-1">Try a different city name or check your search area</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
