"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppLogo } from "@/components/marketplace/app-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Users, 
  UserCheck, 
  Layers, 
  Star, 
  Database, 
  ShieldAlert, 
  Trash2, 
  Ban, 
  Check, 
  X, 
  LogOut, 
  UserX,
  Plus,
  Eye,
  Calendar,
  AlertTriangle
} from "lucide-react"

type TabType = "verifications" | "registry" | "providers" | "clients" | "services" | "reviews"

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>("verifications")
  const [stats, setStats] = useState<any>(null)
  const [listData, setListData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Verification detail modal states
  const [selectedReview, setSelectedReview] = useState<any | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectActionType, setRejectActionType] = useState<"identity" | "professional" | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Registry addition states
  const [newCertId, setNewCertId] = useState("")
  const [newHolderName, setNewHolderName] = useState("")
  const [newReceivedDate, setNewReceivedDate] = useState("")
  const [newCategory, setNewCategory] = useState("doctors")
  const [registryMessage, setRegistryMessage] = useState<string | null>(null)

  // Fetch initial summary stats
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/data")
      if (res.status === 401) {
        router.push("/admin/login")
        return
      }
      if (!res.ok) throw new Error("Failed to load stats.")
      const data = await res.json()
      setStats(data.stats)
    } catch (err) {
      console.error(err)
      setError("Unable to connect to admin API.")
    }
  }

  // Fetch list data based on selected tab
  const fetchTabData = async (tab: TabType) => {
    setLoading(true)
    setError(null)
    try {
      let endpoint = `/api/admin/data?type=${tab}`
      if (tab === "verifications") {
        endpoint = "/api/admin/pending-verifications"
      } else if (tab === "registry") {
        endpoint = "/api/admin/authority-registry"
      }

      const res = await fetch(endpoint)
      if (res.status === 401) {
        router.push("/admin/login")
        return
      }
      if (!res.ok) throw new Error("Failed to load tab data.")
      const data = await res.json()
      
      if (tab === "verifications") {
        setListData(data.verifications || [])
      } else if (tab === "registry") {
        setListData(data.certificates || [])
      } else {
        setListData(data.data || [])
      }
    } catch (err) {
      console.error(err)
      setError("Failed to fetch records.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchTabData(activeTab)
    fetchStats()
  }, [activeTab])

  // Handle Verify Action (Approve / Reject)
  const handleVerifyAction = async (providerId: string, action: "approve" | "reject", type?: "identity" | "professional") => {
    if (action === "reject" && !rejectReason.trim()) {
      alert("Please enter a rejection reason.")
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch("/api/admin/verify-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          providerId, 
          action, 
          message: action === "reject" ? rejectReason : undefined,
          type
        })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Action failed.")
      }

      // Close modal and refresh
      setSelectedReview(null)
      setShowRejectForm(false)
      setRejectActionType(null)
      setRejectReason("")
      fetchTabData(activeTab)
      fetchStats()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating verification status.")
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Ban Toggle
  const handleBanToggle = async (type: "provider" | "client", id: string) => {
    if (!confirm(`Are you sure you want to toggle ban status for this ${type}?`)) return
    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, action: "toggle-ban" })
      })
      if (!res.ok) throw new Error("Action failed.")
      fetchTabData(activeTab)
    } catch (err) {
      alert("Error updating ban status.")
    }
  }

  // Handle deletion of records
  const handleDeleteRecord = async (type: "provider" | "client" | "service" | "review", id: string) => {
    if (!confirm(`Are you sure you want to permanently delete this ${type}? This action is irreversible.`)) return
    try {
      const res = await fetch(`/api/admin/data?type=${type}&id=${id}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Deletion failed.")
      fetchTabData(activeTab)
      fetchStats()
    } catch (err) {
      alert("Error deleting record.")
    }
  }

  // Handle Add to Registry
  const handleAddRegistry = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegistryMessage(null)
    try {
      const res = await fetch("/api/admin/authority-registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certId: newCertId,
          holderName: newHolderName,
          receivedDate: newReceivedDate,
          category: newCategory
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to add certificate.")
      }

      setNewCertId("")
      setNewHolderName("")
      setNewReceivedDate("")
      setRegistryMessage("✅ Certificate successfully added to registry!")
      fetchTabData("registry")
    } catch (err) {
      setRegistryMessage(`❌ Error: ${err instanceof Error ? err.message : "Failed to add record."}`)
    }
  }

  // Remove certificate from registry
  const handleDeleteRegistry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this certificate from the pre-approved registry?")) return
    try {
      const res = await fetch(`/api/admin/authority-registry?id=${id}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Deletion failed.")
      fetchTabData("registry")
    } catch (err) {
      alert("Error deleting registry record.")
    }
  }

  // Logout admin
  const handleLogout = async () => {
    // Simple frontend redirect. The cookie can be cleared by overriding it
    document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
    router.push("/admin/login")
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/40 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AppLogo size="sm" showText={true} />
            <span className="hidden sm:inline-block text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
              Admin Portal
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout} 
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-zinc-900/30 border-zinc-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Providers</p>
                  <p className="text-2xl font-bold text-white">{stats.providers}</p>
                </div>
                <Users className="w-8 h-8 text-primary/60" />
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/30 border-zinc-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Clients</p>
                  <p className="text-2xl font-bold text-white">{stats.clients}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-500/60" />
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/30 border-zinc-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Services</p>
                  <p className="text-2xl font-bold text-white">{stats.services}</p>
                </div>
                <Layers className="w-8 h-8 text-blue-500/60" />
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/30 border-zinc-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Reviews</p>
                  <p className="text-2xl font-bold text-white">{stats.reviews}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500/60" />
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/30 border-primary/20 relative overflow-hidden col-span-2 md:col-span-1">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-xl pointer-events-none" />
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Pending Checks</p>
                  <p className="text-2xl font-bold text-primary">{stats.pendingVerifications}</p>
                </div>
                <ShieldAlert className="w-8 h-8 text-primary" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex border-b border-zinc-800 gap-1 overflow-x-auto pb-px">
          {[
            { id: "verifications", name: "Pending Audits", icon: ShieldAlert },
            { id: "registry", name: "Authority Registry", icon: Database },
            { id: "providers", name: "Providers List", icon: Users },
            { id: "clients", name: "Clients List", icon: UserCheck },
            { id: "services", name: "Services", icon: Layers },
            { id: "reviews", name: "Reviews", icon: Star },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
                  activeTab === tab.id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            )
          })}
        </div>

        {/* Dynamic List Content */}
        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center text-zinc-500 animate-pulse text-sm">
              Loading records from system databases...
            </div>
          ) : (
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur">
              {/* Tab 1: Verifications */}
              {activeTab === "verifications" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-900/50 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-850">
                      <tr>
                        <th className="p-4">Provider</th>
                        <th className="p-4">Submitted Date</th>
                        <th className="p-4">Certificate ID</th>
                        <th className="p-4">AI Face Match</th>
                        <th className="p-4">AI Name Match</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850">
                      {listData.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-zinc-500 text-sm">
                            No pending provider verification requests.
                          </td>
                        </tr>
                      ) : (
                        listData.map((item) => (
                          <tr key={item.id} className="hover:bg-zinc-900/20 transition-colors">
                            <td className="p-4">
                              <div className="font-semibold text-white">{item.name || "Unnamed"}</div>
                              <div className="text-xs text-zinc-400">{item.email}</div>
                            </td>
                            <td className="p-4 text-zinc-300">
                              {item.verificationSubmittedAt ? new Date(item.verificationSubmittedAt).toLocaleDateString() : "N/A"}
                            </td>
                            <td className="p-4 font-mono text-zinc-300">{item.certificateId || "N/A"}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                                item.aiFaceMatch 
                                  ? "bg-green-500/10 text-green-400 border-green-500/20" 
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}>
                                {item.aiFaceMatch ? "MATCHED" : "FLAGGED"}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                                item.aiNameMatch 
                                  ? "bg-green-500/10 text-green-400 border-green-500/20" 
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}>
                                {item.aiNameMatch ? "MATCHED" : "FLAGGED"}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setSelectedReview(item)}
                                className="bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-white rounded-xl text-xs font-semibold"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                Review
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 2: Authority Registry */}
              {activeTab === "registry" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
                  {/* Left Column: Form to Add */}
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="font-bold text-white text-base">Add Verified Certificate</h3>
                      <p className="text-xs text-zinc-400 mt-1">Pre-approve certificates issued by category authorities.</p>
                    </div>

                    <form onSubmit={handleAddRegistry} className="space-y-4">
                      {registryMessage && (
                        <div className="p-3 bg-zinc-800 rounded-xl text-xs font-medium border border-zinc-700 text-zinc-200">
                          {registryMessage}
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">Category Authority</label>
                        <select 
                          value={newCategory}
                          onChange={e => setNewCategory(e.target.value)}
                          className="w-full bg-black/40 border border-zinc-800 text-zinc-100 rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                        >
                          <option value="doctors">Ministry of Health (Doctors)</option>
                          <option value="programmer">Tech Certification / University (Programmers)</option>
                          <option value="translator">Ministry of Justice (Translators)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">Certificate ID</label>
                        <input 
                          type="text" 
                          value={newCertId}
                          onChange={e => setNewCertId(e.target.value)}
                          placeholder="e.g. DOC-12345" 
                          required
                          className="w-full bg-black/40 border border-zinc-800 text-zinc-100 rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">Holder Full Name</label>
                        <input 
                          type="text" 
                          value={newHolderName}
                          onChange={e => setNewHolderName(e.target.value)}
                          placeholder="Name printed on certificate" 
                          required
                          className="w-full bg-black/40 border border-zinc-800 text-zinc-100 rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">Received Date</label>
                        <input 
                          type="date" 
                          value={newReceivedDate}
                          onChange={e => setNewReceivedDate(e.target.value)}
                          required
                          className="w-full bg-black/40 border border-zinc-800 text-zinc-100 rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>

                      <Button type="submit" className="w-full rounded-xl font-semibold">
                        <Plus className="w-4 h-4 mr-1.5" /> Add Certificate
                      </Button>
                    </form>
                  </div>

                  {/* Right Column (span 2): List of Certificates */}
                  <div className="lg:col-span-2 p-6 overflow-x-auto space-y-4">
                    <div>
                      <h3 className="font-bold text-white text-base">Pre-Approved Authorities Certificates Database</h3>
                      <p className="text-xs text-zinc-400 mt-1">Providers cannot upload matching certificate IDs unless listed in this database.</p>
                    </div>

                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-900/50 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-855">
                        <tr>
                          <th className="p-3">Category</th>
                          <th className="p-3">Certificate ID</th>
                          <th className="p-3">Holder Name</th>
                          <th className="p-3">Received Date</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850 text-zinc-300">
                        {listData.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-zinc-500 text-sm">
                              No pre-approved certificates in the registry yet.
                            </td>
                          </tr>
                        ) : (
                          listData.map((cert) => (
                            <tr key={cert.id} className="hover:bg-zinc-900/10">
                              <td className="p-3 capitalize font-medium text-xs">
                                <span className={`px-2 py-0.5 border rounded-full ${
                                  cert.category === "doctors" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                  cert.category === "programmer" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                  "bg-green-500/10 text-green-400 border-green-500/20"
                                }`}>
                                  {cert.category}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-white">{cert.certId}</td>
                              <td className="p-3 font-semibold">{cert.holderName}</td>
                              <td className="p-3 text-xs">
                                {new Date(cert.receivedDate).toLocaleDateString()}
                              </td>
                              <td className="p-3 text-right">
                                <button 
                                  onClick={() => handleDeleteRegistry(cert.id)}
                                  className="text-zinc-500 hover:text-red-400 p-1.5 transition-colors rounded-lg hover:bg-red-500/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Providers List */}
              {activeTab === "providers" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-900/50 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-850">
                      <tr>
                        <th className="p-4">Name</th>
                        <th className="p-4">Joined</th>
                        <th className="p-4">Verification</th>
                        <th className="p-4">Complete</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850">
                      {listData.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-zinc-500 text-sm">No providers found.</td>
                        </tr>
                      ) : (
                        listData.map((p) => (
                          <tr key={p.id} className="hover:bg-zinc-900/20 text-zinc-300">
                            <td className="p-4">
                              <div className="font-semibold text-white">{p.name || "Unnamed"}</div>
                              <div className="text-xs text-zinc-400">{p.email}</div>
                            </td>
                            <td className="p-4 text-xs">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4 font-bold text-xs uppercase">
                              <span className={`px-2 py-0.5 border rounded-full ${
                                p.certificateStatus === "VALID" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                p.certificateStatus === "PENDING" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                "bg-zinc-800 text-zinc-400 border-zinc-700"
                              }`}>
                                {p.certificateStatus || "NONE"}
                              </span>
                            </td>
                            <td className="p-4 font-semibold text-xs">
                              {p.isProfileComplete ? "✅ YES" : "❌ NO"}
                            </td>
                            <td className="p-4">
                              {p.isBanned ? (
                                <span className="text-red-500 text-xs font-bold bg-red-500/10 px-2 py-0.5 border border-red-500/20 rounded-full">BANNED</span>
                              ) : (
                                <span className="text-green-500 text-xs font-bold bg-green-500/10 px-2 py-0.5 border border-green-500/20 rounded-full">ACTIVE</span>
                              )}
                            </td>
                            <td className="p-4 text-right space-x-1.5 shrink-0 whitespace-nowrap">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleBanToggle("provider", p.id)}
                                className={`rounded-xl text-xs font-semibold ${p.isBanned ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white" : "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white"}`}
                              >
                                <Ban className="w-3.5 h-3.5 mr-1" />
                                {p.isBanned ? "Unban" : "Ban"}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteRecord("provider", p.id)}
                                className="rounded-xl text-xs font-semibold"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 4: Clients List */}
              {activeTab === "clients" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-900/50 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-850">
                      <tr>
                        <th className="p-4">Name</th>
                        <th className="p-4">Joined Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850">
                      {listData.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-zinc-500 text-sm">No clients found.</td>
                        </tr>
                      ) : (
                        listData.map((c) => (
                          <tr key={c.id} className="hover:bg-zinc-900/20 text-zinc-300">
                            <td className="p-4">
                              <div className="font-semibold text-white">{c.name || "Unnamed"}</div>
                              <div className="text-xs text-zinc-400">{c.email}</div>
                            </td>
                            <td className="p-4 text-xs">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              {c.isBanned ? (
                                <span className="text-red-500 text-xs font-bold bg-red-500/10 px-2 py-0.5 border border-red-500/20 rounded-full">BANNED</span>
                              ) : (
                                <span className="text-green-500 text-xs font-bold bg-green-500/10 px-2 py-0.5 border border-green-500/20 rounded-full">ACTIVE</span>
                              )}
                            </td>
                            <td className="p-4 text-right space-x-1.5">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleBanToggle("client", c.id)}
                                className={`rounded-xl text-xs font-semibold ${c.isBanned ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white" : "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white"}`}
                              >
                                <Ban className="w-3.5 h-3.5 mr-1" />
                                {c.isBanned ? "Unban" : "Ban"}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteRecord("client", c.id)}
                                className="rounded-xl text-xs font-semibold"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 5: Services */}
              {activeTab === "services" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-900/50 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-850">
                      <tr>
                        <th className="p-4">Service</th>
                        <th className="p-4">Provider</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Rating</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850">
                      {listData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-zinc-500 text-sm">No services listed on the platform.</td>
                        </tr>
                      ) : (
                        listData.map((s) => (
                          <tr key={s.id} className="hover:bg-zinc-900/20 text-zinc-300">
                            <td className="p-4">
                              <div className="font-semibold text-white">{s.name}</div>
                              <div className="text-xs text-zinc-400">{s.category || "General"}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-semibold">{s.provider?.name || "Unknown"}</div>
                              <div className="text-xs text-zinc-400">{s.provider?.email}</div>
                            </td>
                            <td className="p-4 font-mono font-bold text-white">
                              {s.price ? `${s.price} DZD` : "Free"}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1 text-yellow-400 font-bold text-xs">
                                <Star className="w-3.5 h-3.5 fill-yellow-400" />
                                {(s.rating ?? 0).toFixed(1)} <span className="text-zinc-500">({s.reviewCount ?? 0})</span>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteRecord("service", s.id)}
                                className="rounded-xl text-xs"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 6: Reviews */}
              {activeTab === "reviews" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-900/50 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-850">
                      <tr>
                        <th className="p-4">Comment</th>
                        <th className="p-4">Client</th>
                        <th className="p-4">Service / Provider</th>
                        <th className="p-4">Rating</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850">
                      {listData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-zinc-500 text-sm">No reviews submitted yet.</td>
                        </tr>
                      ) : (
                        listData.map((r) => (
                          <tr key={r.id} className="hover:bg-zinc-900/20 text-zinc-300">
                            <td className="p-4">
                              <p className="text-zinc-100 max-w-md line-clamp-2">"{r.comment}"</p>
                              <p className="text-xs text-zinc-500 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                            </td>
                            <td className="p-4">
                              <div className="font-semibold text-white">{r.client?.name || "Anonymous"}</div>
                              <div className="text-xs text-zinc-400">{r.client?.email}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-semibold">{r.service?.name || "Deleted Service"}</div>
                              <div className="text-xs text-zinc-400">By: {r.service?.provider?.name || "Deleted Provider"}</div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1 text-yellow-400 font-bold text-xs">
                                <Star className="w-3.5 h-3.5 fill-yellow-400" />
                                {r.rating}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteRecord("review", r.id)}
                                className="rounded-xl text-xs"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Verification Detailed Audit Modal */}
      {selectedReview && (() => {
        const reviewProfStatus = 
          selectedReview.category === "regulated_profession" ? selectedReview.licenseStatus :
          selectedReview.category === "artisan" ? selectedReview.cnamCardStatus :
          selectedReview.category === "auto_entrepreneur" ? selectedReview.anaeCardStatus :
          "NOT_SUBMITTED"

        return (
          <Dialog open={!!selectedReview} onOpenChange={(open) => {
            if (!open) {
              setSelectedReview(null)
              setShowRejectForm(false)
              setRejectActionType(null)
              setRejectReason("")
            }
          }}>
            <DialogContent className="sm:max-w-4xl bg-zinc-900 border-zinc-800 text-zinc-100 overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  📋 Review Provider Verification Request
                </DialogTitle>
                <DialogDescription className="text-zinc-400 text-xs">
                  Auditing documents submitted by {selectedReview.name} ({selectedReview.email}).
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* SECTION 1: IDENTITY VERIFICATION */}
                <div className="border border-zinc-800 rounded-2xl p-5 bg-zinc-950/40 space-y-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2">
                        👤 1. Identity Verification Check
                      </h3>
                      <p className="text-xs text-zinc-400">Verifying live selfie match against national ID card.</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 text-center uppercase ${
                      selectedReview.identityStatus === "APPROVED" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                      selectedReview.identityStatus === "PENDING" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      selectedReview.identityStatus === "REJECTED" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}>
                      Identity: {selectedReview.identityStatus || "NOT_SUBMITTED"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Selfie Image */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Live Webcam Selfie</span>
                      <div className="aspect-[4/3] relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center my-2">
                        {selectedReview.selfieImage ? (
                          <img src={selectedReview.selfieImage} alt="Webcam Selfie" className="w-full h-full object-cover transform -scale-x-100" />
                        ) : (
                          <span className="text-xs text-zinc-650">No photo captured</span>
                        )}
                      </div>
                    </div>

                    {/* ID Image */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Government ID Scan</span>
                      <div className="aspect-[4/3] relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center my-2">
                        {selectedReview.idCardImage ? (
                          <img src={selectedReview.idCardImage} alt="Government ID" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-zinc-650">No ID uploaded</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Identity Pre-audit info */}
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1 text-xs">
                    <div className="flex gap-4">
                      <span>Face Match: <strong className={selectedReview.aiFaceMatch ? "text-green-400" : "text-amber-400"}>{selectedReview.aiFaceMatch ? "MATCHED" : "FLAGGED"}</strong></span>
                      <span>Name Check: <strong className={selectedReview.aiNameMatch ? "text-green-400" : "text-amber-400"}>{selectedReview.aiNameMatch ? "MATCHED" : "FLAGGED"}</strong></span>
                    </div>
                    <p className="text-[11px] text-zinc-400 italic mt-1">"{selectedReview.aiAnalysisMessage || "No identity pre-audit report generated."}"</p>
                  </div>

                  {/* Identity Actions */}
                  {selectedReview.identityStatus === "PENDING" && (
                    <div className="pt-2">
                      {showRejectForm && rejectActionType === "identity" ? (
                        <div className="space-y-3 p-3 border border-zinc-800 rounded-xl animate-in slide-in-from-bottom-2 duration-200">
                          <label className="text-[11px] font-bold text-zinc-400 uppercase">Rejection Reason</label>
                          <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Explain why the identity was rejected..."
                            className="w-full bg-black/40 border border-zinc-800 text-zinc-100 rounded-xl p-3 text-xs focus:ring-1 focus:ring-primary outline-none h-16 resize-none"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => { setShowRejectForm(false); setRejectActionType(null); }} className="text-zinc-450 hover:text-white">Cancel</Button>
                            <Button variant="destructive" size="sm" disabled={actionLoading} onClick={() => handleVerifyAction(selectedReview.id, "reject", "identity")}>Confirm Reject</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => { setShowRejectForm(true); setRejectActionType("identity"); setRejectReason(""); }}
                            className="border-zinc-800 hover:bg-red-500/10 hover:text-red-400 text-xs h-9 rounded-lg"
                          >
                            <X className="w-3.5 h-3.5 mr-1" /> Reject Identity
                          </Button>
                          <Button
                            disabled={actionLoading}
                            onClick={() => handleVerifyAction(selectedReview.id, "approve", "identity")}
                            className="bg-green-600 hover:bg-green-500 text-white text-xs h-9 rounded-lg"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> Approve Identity
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SECTION 2: PROFESSIONAL CREDENTIALS */}
                <div className="border border-zinc-800 rounded-2xl p-5 bg-zinc-950/40 space-y-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2">
                        📄 2. Professional Credentials Check (Gemini OCR)
                      </h3>
                      <p className="text-xs text-zinc-400">Auditing professional card / certificate credentials.</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 text-center uppercase ${
                      reviewProfStatus === "VERIFIED" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                      reviewProfStatus === "PENDING" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      reviewProfStatus === "REJECTED" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}>
                      Professional: {reviewProfStatus || "NOT_SUBMITTED"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Card Image */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Professional Card / Document</span>
                      <div className="aspect-[4/3] relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center my-2">
                        {selectedReview.certificateImage ? (
                          <img src={selectedReview.certificateImage} alt="Professional License" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-zinc-650">No document uploaded</span>
                        )}
                      </div>
                    </div>

                    {/* Gemini Extracted Info */}
                    <div className="space-y-3 text-xs">
                      <div className="bg-zinc-900 border border-zinc-850 rounded-xl p-3.5 space-y-2.5">
                        <h4 className="font-bold text-primary text-[11px] uppercase tracking-wider">Gemini OCR Pre-Audit Findings</h4>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Category:</span>
                            <span className="font-semibold text-white capitalize">{selectedReview.category?.replace("_", " ")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Card Number:</span>
                            <span className="font-mono font-bold text-white">{selectedReview.certificateId || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Extracted Name:</span>
                            <span className="font-semibold text-white">{selectedReview.extractedFullName || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Extracted Date:</span>
                            <span className="font-semibold text-white">{selectedReview.extractedDate || "N/A"}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-zinc-800">
                            <span className="text-zinc-400">Name Match:</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${selectedReview.aiNameMatch ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                              {selectedReview.aiNameMatch ? "MATCHED" : "FLAGGED"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Pre-approved Authority registry check */}
                      <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-zinc-400">Official Authority Registry Check</span>
                        <div className="font-semibold text-white text-xs">
                          {selectedReview.matchedAuthorityCertificate ? (
                            <span className="text-green-400">✓ Found in Pre-Approved Registry</span>
                          ) : (
                            <span className="text-red-400">✗ Not registered in Pre-Approved Database</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Professional Actions */}
                  {reviewProfStatus === "PENDING" && (
                    <div className="pt-2">
                      {showRejectForm && rejectActionType === "professional" ? (
                        <div className="space-y-3 p-3 border border-zinc-800 rounded-xl animate-in slide-in-from-bottom-2 duration-200">
                          <label className="text-[11px] font-bold text-zinc-400 uppercase">Rejection Reason</label>
                          <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Explain why the credentials were rejected..."
                            className="w-full bg-black/40 border border-zinc-800 text-zinc-100 rounded-xl p-3 text-xs focus:ring-1 focus:ring-primary outline-none h-16 resize-none"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => { setShowRejectForm(false); setRejectActionType(null); }} className="text-zinc-450 hover:text-white">Cancel</Button>
                            <Button variant="destructive" size="sm" disabled={actionLoading} onClick={() => handleVerifyAction(selectedReview.id, "reject", "professional")}>Confirm Reject</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => { setShowRejectForm(true); setRejectActionType("professional"); setRejectReason(""); }}
                            className="border-zinc-800 hover:bg-red-500/10 hover:text-red-400 text-xs h-9 rounded-lg"
                          >
                            <X className="w-3.5 h-3.5 mr-1" /> Reject Credentials
                          </Button>
                          <Button
                            disabled={actionLoading}
                            onClick={() => handleVerifyAction(selectedReview.id, "approve", "professional")}
                            className="bg-green-600 hover:bg-green-500 text-white text-xs h-9 rounded-lg"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> Approve Credentials
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )
      })()}
    </div>
  )
}
