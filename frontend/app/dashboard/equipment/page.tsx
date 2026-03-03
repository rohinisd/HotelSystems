"use client";

import { useState, useEffect } from "react";
import { api, type Equipment, type Branch } from "@/lib/api";
import { getRole, getFacilityId } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "Racket",
  "Ball",
  "Bat",
  "Net",
  "Shoes",
  "Helmet",
  "Pads",
  "Stumps",
  "Shuttlecock",
  "Gloves",
  "Jersey",
  "Other",
];

const CONDITIONS = [
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
  { value: "needs_repair", label: "Needs Repair" },
];

interface EquipmentFormData {
  branch_id: string;
  name: string;
  category: string;
  brand: string;
  total_quantity: string;
  available_quantity: string;
  condition: string;
  rental_rate: string;
  is_rentable: boolean;
  notes: string;
}

const emptyForm: EquipmentFormData = {
  branch_id: "",
  name: "",
  category: "Racket",
  brand: "",
  total_quantity: "1",
  available_quantity: "1",
  condition: "good",
  rental_rate: "",
  is_rentable: false,
  notes: "",
};

const conditionConfig: Record<string, { color: string; icon: typeof CheckCircle }> = {
  good: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  fair: { color: "bg-amber-100 text-amber-700", icon: AlertTriangle },
  poor: { color: "bg-red-100 text-red-700", icon: ShieldAlert },
  needs_repair: { color: "bg-purple-100 text-purple-700", icon: Wrench },
};

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<EquipmentFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [total, setTotal] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCondition, setFilterCondition] = useState("");

  const role = getRole();
  const canEdit = role === "owner" || role === "manager";

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const params: { category?: string; condition?: string; limit?: number } = { limit: 100 };
      if (filterCategory) params.category = filterCategory;
      if (filterCondition) params.condition = filterCondition;

      const [eqData, facilityId] = [await api.getEquipment(params), getFacilityId()];
      setEquipment(eqData.items);
      setTotal(eqData.total);
      if (facilityId) {
        const b = await api.getBranches(facilityId);
        setBranches(b);
      }
    } catch {
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [filterCategory, filterCondition]);

  const filtered = equipment.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      (e.brand && e.brand.toLowerCase().includes(q))
    );
  });

  function openCreate() {
    setForm({ ...emptyForm, branch_id: branches[0]?.id ? String(branches[0].id) : "" });
    setEditId(null);
    setShowForm(true);
    setError("");
  }

  function openEdit(item: Equipment) {
    setForm({
      branch_id: item.branch_id ? String(item.branch_id) : "",
      name: item.name,
      category: item.category,
      brand: item.brand || "",
      total_quantity: String(item.total_quantity),
      available_quantity: String(item.available_quantity),
      condition: item.condition,
      rental_rate: item.rental_rate ? String(item.rental_rate) : "",
      is_rentable: item.is_rentable,
      notes: item.notes || "",
    });
    setEditId(item.id);
    setShowForm(true);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const totalQty = parseInt(form.total_quantity);
      const availQty = parseInt(form.available_quantity);

      if (availQty > totalQty) {
        setError("Available quantity cannot exceed total quantity");
        setSaving(false);
        return;
      }

      if (editId) {
        await api.updateEquipment(editId, {
          branch_id: form.branch_id ? parseInt(form.branch_id) : undefined,
          name: form.name,
          category: form.category,
          brand: form.brand || undefined,
          total_quantity: totalQty,
          available_quantity: availQty,
          condition: form.condition,
          rental_rate: form.rental_rate ? parseFloat(form.rental_rate) : undefined,
          is_rentable: form.is_rentable,
          notes: form.notes || undefined,
        });
        toast.success("Equipment updated");
      } else {
        await api.createEquipment({
          branch_id: form.branch_id ? parseInt(form.branch_id) : undefined,
          name: form.name,
          category: form.category,
          brand: form.brand || undefined,
          total_quantity: totalQty,
          available_quantity: availQty,
          condition: form.condition,
          rental_rate: form.rental_rate ? parseFloat(form.rental_rate) : undefined,
          is_rentable: form.is_rentable,
          notes: form.notes || undefined,
        });
        toast.success("Equipment added");
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleteId === null) return;
    try {
      await api.deleteEquipment(deleteId);
      toast.success("Equipment removed");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleteId(null);
    }
  }

  const stockSummary = {
    totalItems: total,
    lowStock: equipment.filter((e) => e.available_quantity <= Math.ceil(e.total_quantity * 0.2) && e.available_quantity > 0).length,
    outOfStock: equipment.filter((e) => e.available_quantity === 0).length,
    needsRepair: equipment.filter((e) => e.condition === "needs_repair").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipment</h1>
          <p className="text-sm text-slate-500">Manage your sports equipment inventory</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> Add Equipment
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stockSummary.totalItems}</p>
              <p className="text-xs text-slate-500">Total Items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stockSummary.lowStock}</p>
              <p className="text-xs text-slate-500">Low Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stockSummary.outOfStock}</p>
              <p className="text-xs text-slate-500">Out of Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stockSummary.needsRepair}</p>
              <p className="text-xs text-slate-500">Needs Repair</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All Conditions</option>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editId ? "Edit Equipment" : "Add New Equipment"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Name</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Wilson Pro Staff"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Brand</label>
                  <Input
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="e.g. Wilson, Yonex"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Branch</label>
                  <select
                    value={form.branch_id}
                    onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">All branches</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Total Quantity</label>
                  <Input
                    type="number"
                    value={form.total_quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({
                        ...form,
                        total_quantity: val,
                        available_quantity: !editId ? val : form.available_quantity,
                      });
                    }}
                    required
                    min="1"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Available Quantity</label>
                  <Input
                    type="number"
                    value={form.available_quantity}
                    onChange={(e) => setForm({ ...form, available_quantity: e.target.value })}
                    required
                    min="0"
                    max={form.total_quantity}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Condition</label>
                  <select
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Rental Rate (INR/hr)</label>
                  <Input
                    type="number"
                    value={form.rental_rate}
                    onChange={(e) => setForm({ ...form, rental_rate: e.target.value })}
                    placeholder="Optional"
                    min="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Available for Rent</label>
                  <div className="flex items-center gap-2 h-10">
                    <input
                      type="checkbox"
                      checked={form.is_rentable}
                      onChange={(e) => setForm({ ...form, is_rentable: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-600">{form.is_rentable ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                  {saving ? "Saving..." : editId ? "Update Equipment" : "Add Equipment"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Equipment List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
                <div className="mt-3 h-4 w-24 animate-pulse rounded bg-slate-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <Package className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-slate-500">
              {searchQuery || filterCategory || filterCondition
                ? "No equipment matches your filters"
                : "No equipment added yet"}
            </p>
            {canEdit && !searchQuery && !filterCategory && !filterCondition && (
              <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
                Add your first equipment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const cond = conditionConfig[item.condition] || conditionConfig.good;
            const CondIcon = cond.icon;
            const stockPct = item.total_quantity > 0
              ? (item.available_quantity / item.total_quantity) * 100
              : 0;
            const stockColor =
              stockPct === 0
                ? "bg-red-500"
                : stockPct <= 20
                  ? "bg-amber-500"
                  : "bg-emerald-500";

            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">{item.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {item.category}
                        </span>
                        {item.brand && (
                          <span className="text-xs text-slate-400">{item.brand}</span>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Stock bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Stock</span>
                      <span className="font-medium">
                        {item.available_quantity} / {item.total_quantity} available
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${stockColor}`}
                        style={{ width: `${stockPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1.5">
                      <CondIcon className={`h-3.5 w-3.5 ${cond.color.split(" ")[1]}`} />
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cond.color}`}>
                        {item.condition === "needs_repair" ? "Needs Repair" : item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.is_rentable && item.rental_rate && (
                        <span className="text-xs font-medium text-emerald-600">
                          {formatINR(item.rental_rate)}/hr
                        </span>
                      )}
                      {item.is_rentable && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Rentable
                        </span>
                      )}
                    </div>
                  </div>

                  {item.branch_name && (
                    <p className="text-xs text-slate-400">{item.branch_name}</p>
                  )}

                  {item.notes && (
                    <p className="text-xs text-slate-400 truncate" title={item.notes}>{item.notes}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Remove Equipment"
        message="Are you sure you want to remove this equipment from your inventory?"
        confirmLabel="Yes, Remove"
        cancelLabel="Keep Equipment"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
