import { useMemo, useState, type FormEvent } from "react"
import {
  CalendarDays,
  Download,
  Plus,
  ReceiptText,
  Trash2,
  Wallet,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Expense = {
  id: string
  amount: number
  category: string
  note: string
  date: string
  createdAt: string
}

const STORAGE_KEY = "catatPengeluaranData"
const CATEGORIES = ["Makan", "Transport", "Belanja", "Lainnya"] as const

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getTodayString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getThisMonthString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

function formatDisplayMonth() {
  const now = new Date()
  return now.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  })
}

function loadExpenses(): Expense[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    const parsed = JSON.parse(data)
    return Array.isArray(parsed) ? (parsed as Expense[]) : []
  } catch (e) {
    console.error("Error loading data:", e)
    return []
  }
}

function saveExpenses(expenses: Expense[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
}

function escapeCsvField(value: unknown) {
  const str = value == null ? "" : String(value)
  if (/[",\n\r]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>(() => loadExpenses())
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState<string>("Makan")
  const [note, setNote] = useState("")

  const monthExpenses = useMemo(() => {
    const month = getThisMonthString()
    return expenses
      .filter((item) => item.date && item.date.indexOf(month) === 0)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
  }, [expenses])

  const total = useMemo(
    () => monthExpenses.reduce((sum, item) => sum + Number(item.amount), 0),
    [monthExpenses],
  )

  const categoryRows = useMemo(() => {
    const totalsByCategory: Record<string, number> = {}
    for (const item of monthExpenses) {
      const cat = item.category || "Lainnya"
      totalsByCategory[cat] = (totalsByCategory[cat] || 0) + Number(item.amount)
    }
    return Object.keys(totalsByCategory)
      .map((cat) => ({ category: cat, amount: totalsByCategory[cat] }))
      .sort((a, b) => b.amount - a.amount)
  }, [monthExpenses])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const parsedAmount = parseInt(amount, 10)
    if (!parsedAmount || parsedAmount <= 0) {
      alert("Masukkan nominal yang valid!")
      return
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: parsedAmount,
      category,
      note: note.trim(),
      date: getTodayString(),
      createdAt: new Date().toISOString(),
    }

    const next = [...loadExpenses(), newExpense]
    saveExpenses(next)
    setExpenses(next)
    setAmount("")
    setNote("")
    setCategory("Makan")
  }

  function handleDelete(id: string) {
    const next = loadExpenses().filter((item) => item.id !== id)
    saveExpenses(next)
    setExpenses(next)
  }

  function exportMonthCsv() {
    if (monthExpenses.length === 0) return

    const header = ["Tanggal", "Kategori", "Nominal", "Catatan"]
    const rows = monthExpenses.map((item) =>
      [
        item.date || "",
        item.category || "",
        item.amount,
        item.note || "",
      ]
        .map(escapeCsvField)
        .join(","),
    )
    const csvContent =
      "\uFEFF" + [header.map(escapeCsvField).join(",")].concat(rows).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "pengeluaran-" + getThisMonthString() + ".csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const countText =
    monthExpenses.length === 1 ? "1 item" : monthExpenses.length + " item"

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-6 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Wallet className="size-4" aria-hidden="true" />
            Pengeluaran Harian
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Catat Pengeluaran
          </h1>
          <p className="text-muted-foreground">
            Catat pengeluaran harianmu dengan mudah
          </p>
        </header>

        <div className="grid gap-4">
          <Card className="border-primary/20 bg-primary text-primary-foreground shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-primary-foreground/80">
                Total Pengeluaran Bulan Ini
              </CardDescription>
              <CardTitle className="text-3xl font-bold tracking-tight sm:text-4xl">
                {formatRupiah(total)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm text-primary-foreground/85">
                <CalendarDays className="size-4" aria-hidden="true" />
                <span>{formatDisplayMonth()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Per Kategori Bulan Ini</CardTitle>
              <CardDescription>
                Ringkasan pengeluaran berdasarkan kategori
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada data bulan ini.
                </p>
              ) : (
                <div className="space-y-4">
                  {categoryRows.map((row) => {
                    const percent = total > 0 ? (row.amount / total) * 100 : 0
                    const percentText =
                      percent.toLocaleString("id-ID", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 1,
                      }) + "%"
                    return (
                      <div key={row.category} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <div className="font-medium text-foreground">
                            {row.category}
                          </div>
                          <div className="text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {formatRupiah(row.amount)}
                            </span>{" "}
                            · {percentText}
                          </div>
                        </div>
                        <div
                          className="h-2 overflow-hidden rounded-full bg-muted"
                          role="progressbar"
                          aria-label={`Persentase ${row.category}`}
                          aria-valuenow={Math.round(percent)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="h-full rounded-full bg-primary transition-[width]"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tambah Pengeluaran</CardTitle>
              <CardDescription>
                Isi nominal, kategori, dan catatan pengeluaran
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
                <div className="space-y-2">
                  <Label htmlFor="amount">Nominal (Rp)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="contoh: 25000"
                    min={1}
                    inputMode="numeric"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Catatan</Label>
                  <Input
                    id="note"
                    type="text"
                    placeholder="contoh: Nasi goreng siang"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="size-4" aria-hidden="true" />
                  Simpan Pengeluaran
                </Button>
              </form>
            </CardContent>
          </Card>

          <section aria-labelledby="month-list-title" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 id="month-list-title" className="text-lg font-semibold">
                  Bulan Ini
                </h2>
                <Badge variant="secondary">{countText}</Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={exportMonthCsv}
                disabled={monthExpenses.length === 0}
              >
                <Download className="size-4" aria-hidden="true" />
                Export CSV
              </Button>
            </div>

            {monthExpenses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
                    <ReceiptText className="size-8" aria-hidden="true" />
                  </div>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    Belum ada pengeluaran bulan ini.
                    <br />
                    Yuk catat pengeluaran pertamamu!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {monthExpenses.map((item) => (
                  <Card key={item.id} className="py-0">
                    <CardContent className="flex items-start justify-between gap-3 p-4">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="font-medium">
                            {item.category}
                          </Badge>
                        </div>
                        {item.note && item.note.trim() ? (
                          <p className="break-words text-sm text-foreground">
                            {item.note}
                          </p>
                        ) : (
                          <p className="text-sm italic text-muted-foreground">
                            Tanpa catatan
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="text-sm font-semibold text-foreground sm:text-base">
                          {formatRupiah(Number(item.amount))}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-destructive"
                              aria-label={`Hapus pengeluaran ${item.category}`}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus pengeluaran ini?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Pengeluaran{" "}
                                <span className="font-medium text-foreground">
                                  {item.category}
                                </span>{" "}
                                sebesar{" "}
                                <span className="font-medium text-foreground">
                                  {formatRupiah(Number(item.amount))}
                                </span>{" "}
                                akan dihapus dari catatan bulan ini.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => handleDelete(item.id)}
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
