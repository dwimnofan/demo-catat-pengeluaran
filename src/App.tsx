import { useMemo, useState, type FormEvent } from "react"
import {
  CalendarDays,
  Car,
  Download,
  Ellipsis,
  Plus,
  ReceiptText,
  ShoppingBag,
  Trash2,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { Label as RechartsLabel, Pie, PieChart } from "recharts"
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
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

type CategoryName = "Makan" | "Transport" | "Belanja" | "Lainnya"

const STORAGE_KEY = "catatPengeluaranData"

const CATEGORY_META: Record<
  CategoryName,
  { icon: LucideIcon; color: string }
> = {
  Makan: { icon: Utensils, color: "var(--chart-1)" },
  Transport: { icon: Car, color: "var(--chart-2)" },
  Belanja: { icon: ShoppingBag, color: "var(--chart-3)" },
  Lainnya: { icon: Ellipsis, color: "var(--chart-4)" },
}

const CATEGORIES = Object.keys(CATEGORY_META) as CategoryName[]

const chartConfig = {
  amount: { label: "Nominal" },
  Makan: { label: "Makan", color: "var(--chart-1)" },
  Transport: { label: "Transport", color: "var(--chart-2)" },
  Belanja: { label: "Belanja", color: "var(--chart-3)" },
  Lainnya: { label: "Lainnya", color: "var(--chart-4)" },
} satisfies ChartConfig

function getCategoryMeta(category: string) {
  if (category in CATEGORY_META) {
    return CATEGORY_META[category as CategoryName]
  }
  return { icon: Ellipsis, color: "var(--chart-5)" }
}

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
      .map((cat) => ({
        category: cat,
        amount: totalsByCategory[cat],
        fill: getCategoryMeta(cat).color,
      }))
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
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            <Wallet className="size-4" aria-hidden="true" />
            Pengeluaran Harian
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Catat <span className="text-primary">Pengeluaran</span>
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            Pantau pengeluaran bulananmu dengan cepat, jelas, dan rapi.
          </p>
        </header>

        <div className="grid gap-4">
          <Card className="border-primary/25 bg-gradient-to-br from-primary/20 via-card to-card shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-muted-foreground">
                Total Pengeluaran Bulan Ini
              </CardDescription>
              <CardTitle className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {formatRupiah(total)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="size-4 text-primary" aria-hidden="true" />
                <span>{formatDisplayMonth()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Per Kategori Bulan Ini</CardTitle>
              <CardDescription>
                Distribusi pengeluaran berdasarkan kategori
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada data bulan ini.
                </p>
              ) : (
                <div className="grid gap-6 md:grid-cols-[minmax(0,260px)_1fr] md:items-center">
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square h-[260px] w-full max-w-[260px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            hideLabel
                            formatter={(value, name) => (
                              <div className="flex w-full items-center justify-between gap-3">
                                <span className="text-muted-foreground">{name}</span>
                                <span className="font-mono font-semibold text-foreground">
                                  {formatRupiah(Number(value))}
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Pie
                        data={categoryRows}
                        dataKey="amount"
                        nameKey="category"
                        innerRadius={72}
                        outerRadius={108}
                        strokeWidth={4}
                        stroke="var(--background)"
                      >
                        <RechartsLabel
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) - 2}
                                    className="fill-foreground text-2xl font-bold"
                                  >
                                    {monthExpenses.length}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 20}
                                    className="fill-muted-foreground text-xs"
                                  >
                                    item
                                  </tspan>
                                </text>
                              )
                            }
                            return null
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>

                  <div className="space-y-3">
                    {categoryRows.map((row) => {
                      const meta = getCategoryMeta(row.category)
                      const Icon = meta.icon
                      const percent = total > 0 ? (row.amount / total) * 100 : 0
                      const percentText =
                        percent.toLocaleString("id-ID", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 1,
                        }) + "%"
                      return (
                        <div
                          key={row.category}
                          className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/20 p-3"
                        >
                          <div
                            className="flex size-10 shrink-0 items-center justify-center rounded-md"
                            style={{ backgroundColor: `color-mix(in oklab, ${meta.color} 20%, transparent)`, color: meta.color }}
                            aria-hidden="true"
                          >
                            <Icon className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium text-foreground">{row.category}</p>
                              <p className="text-sm text-muted-foreground">{percentText}</p>
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                              {formatRupiah(row.amount)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Tambah Pengeluaran</CardTitle>
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
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" className="h-11 w-full">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => {
                        const Icon = CATEGORY_META[cat].icon
                        return (
                          <SelectItem key={cat} value={cat}>
                            <div className="flex items-center gap-2">
                              <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                              <span>{cat}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
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
                    className="h-11"
                  />
                </div>

                <Button type="submit" size="lg" className="w-full font-semibold">
                  <Plus className="size-4" aria-hidden="true" />
                  Simpan Pengeluaran
                </Button>
              </form>
            </CardContent>
          </Card>

          <section aria-labelledby="month-list-title" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 id="month-list-title" className="text-xl font-semibold">
                  Bulan Ini
                </h2>
                <Badge variant="secondary" className="px-2.5 py-0.5">{countText}</Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={exportMonthCsv}
                disabled={monthExpenses.length === 0}
              >
                <Download className="size-4" aria-hidden="true" />
                Export CSV
              </Button>
            </div>

            {monthExpenses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="mb-4 rounded-full border border-primary/20 bg-primary/10 p-4 text-primary">
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
                {monthExpenses.map((item) => {
                  const meta = getCategoryMeta(item.category)
                  const Icon = meta.icon
                  return (
                    <Card key={item.id} className="py-0 transition-colors hover:border-primary/30">
                      <CardContent className="flex items-start justify-between gap-3 p-4">
                        <div className="flex min-w-0 flex-1 gap-3">
                          <div
                            className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md"
                            style={{ backgroundColor: `color-mix(in oklab, ${meta.color} 20%, transparent)`, color: meta.color }}
                            aria-hidden="true"
                          >
                            <Icon className="size-5" />
                          </div>
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
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
