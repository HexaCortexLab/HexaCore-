
interface TokenData {
  name: string
  riskLevel: "Low" | "Medium" | "High"
  volume: number
}

interface Transfer {
  amount: number
  token: string
  address: string
}

interface ActivityPoint {
  time: string
  value: number
}

const AnalyzerDashboard: React.FC = () => {
  const [tokenData, setTokenData] = useState<TokenData>({
    name: "SOLANA",
    riskLevel: "High",
    volume: 1543200,
  })
  const [whaleTransfers, setWhaleTransfers] = useState<Transfer[]>([])
  const [walletActivity, setWalletActivity] = useState<ActivityPoint[]>([])

  useEffect(() => {
    async function loadData() {
      const analysis = await fetchTokenAnalysis("SOLANA")
      setTokenData({
        name: analysis.name,
        riskLevel: analysis.riskLevel,
        volume: analysis.volume,
      })
      setWhaleTransfers(analysis.whaleTransfers)
      setWalletActivity(analysis.walletActivity)
    }
    loadData()
  }, [])

