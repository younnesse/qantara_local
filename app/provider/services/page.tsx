"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { 
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  X,
  Clock,
  DollarSign
} from "lucide-react"

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
}

const initialServices: Service[] = [
  { id: "1", name: "Video Consultation", description: "30-minute virtual appointment", price: 5000, duration: 30 },
  { id: "2", name: "In-Person Visit", description: "Full examination and consultation", price: 10000, duration: 60 },
  { id: "3", name: "Follow-up Call", description: "Quick check-in appointment", price: 2500, duration: 15 },
]

export default function ProviderServicesPage() {
  const { t } = useLanguage()
  const [services, setServices] = useState<Service[]>(initialServices)
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
  })

  const openAddModal = () => {
    setEditingService(null)
    setFormData({ name: "", description: "", price: "", duration: "" })
    setShowModal(true)
  }

  const openEditModal = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration.toString(),
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newService: Service = {
      id: editingService?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration),
    }

    if (editingService) {
      setServices((prev) => prev.map((s) => (s.id === editingService.id ? newService : s)))
    } else {
      setServices((prev) => [...prev, newService])
    }

    setShowModal(false)
  }

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <main className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/provider/dashboard"
                className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground rtl-flip" />
              </Link>
              <h1 className="text-xl font-bold text-foreground">{t("services.title")}</h1>
            </div>
            <Button onClick={openAddModal} size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              {t("services.add")}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-4">
        {services.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{t("services.noServices")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("services.noServicesDesc")}
            </p>
            <Button onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              {t("services.addService")}
            </Button>
          </div>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className="bg-card rounded-2xl border border-border p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{service.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1 text-sm font-medium text-primary">
                      {service.price} DA
                    </span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {service.duration} min
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(service)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => deleteService(service.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-card rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {editingService ? t("services.editService") : t("services.addNewService")}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-muted rounded-lg"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("services.name")}</Label>
                <Input
                  id="name"
                  placeholder={t("services.namePlaceholder")}
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("services.description")}</Label>
                <Input
                  id="description"
                  placeholder={t("services.descriptionPlaceholder")}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">{t("services.price")}</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="1500"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">{t("services.duration")}</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    step="5"
                    placeholder="30"
                    value={formData.duration}
                    onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                >
                  {t("services.cancel")}
                </Button>
                <Button type="submit" className="flex-1">
                  {editingService ? t("services.saveChanges") : t("services.addService")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
