"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Calculator, Zap, Wallet, AlertCircle, CheckCircle } from "lucide-react"
import { ethers } from "ethers"

// Contract ABI (simplified for the functions we need)
const CALCULATOR_ABI = [
  "function add(uint256 a, uint256 b) public pure returns (uint256)",
  "function subtract(uint256 a, uint256 b) public pure returns (uint256)",
  "function multiply(uint256 a, uint256 b) public pure returns (uint256)",
  "function divide(uint256 a, uint256 b) public pure returns (uint256)",
  "function calculatePower(uint256 base, uint256 exponent) public view returns (uint256)",
  "function calculateSquareRoot(uint256 number) public returns (uint256)",
  "function owner() public view returns (address)",
  "function scientificCalculatorAddress() public view returns (address)",
]

export default function CalculatorDApp() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [account, setAccount] = useState<string>("")
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>("")
  const [error, setError] = useState<string>("")

  // Input states
  const [inputA, setInputA] = useState<string>("")
  const [inputB, setInputB] = useState<string>("")
  const [base, setBase] = useState<string>("")
  const [exponent, setExponent] = useState<string>("")
  const [sqrtInput, setSqrtInput] = useState<string>("")

  // Replace with your actual contract address
  const CONTRACT_ADDRESS = "0xe9356A7766765d69B2035A431Ab4dd303C978147" // Add your deployed contract address here

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.send("eth_requestAccounts", [])
        const signer = await provider.getSigner()
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CALCULATOR_ABI, signer)

        setProvider(provider)
        setSigner(signer)
        setContract(contract)
        setAccount(accounts[0])
        setIsConnected(true)
        setError("")
      } else {
        setError("Please install MetaMask to use this application")
      }
    } catch (err: any) {
      setError(`Failed to connect wallet: ${err.message}`)
    }
  }

  const disconnectWallet = () => {
    setProvider(null)
    setSigner(null)
    setContract(null)
    setAccount("")
    setIsConnected(false)
    setResult("")
    setError("")
    // Clear all inputs
    setInputA("")
    setInputB("")
    setBase("")
    setExponent("")
    setSqrtInput("")
  }

  const executeBasicOperation = async (operation: string) => {
    if (!contract || !inputA || !inputB) {
      setError("Please enter both values and connect your wallet")
      return
    }

    setLoading(true)
    setError("")

    try {
      const a = ethers.parseUnits(inputA, 0)
      const b = ethers.parseUnits(inputB, 0)
      let result

      switch (operation) {
        case "add":
          result = await contract.add(a, b)
          break
        case "subtract":
          result = await contract.subtract(a, b)
          break
        case "multiply":
          result = await contract.multiply(a, b)
          break
        case "divide":
          result = await contract.divide(a, b)
          break
        default:
          throw new Error("Invalid operation")
      }

      setResult(result.toString())
    } catch (err: any) {
      setError(`Operation failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const executePower = async () => {
    if (!contract || !base || !exponent) {
      setError("Please enter base and exponent values")
      return
    }

    setLoading(true)
    setError("")

    try {
      const baseValue = ethers.parseUnits(base, 0)
      const exponentValue = ethers.parseUnits(exponent, 0)
      const result = await contract.calculatePower(baseValue, exponentValue)
      setResult(result.toString())
    } catch (err: any) {
      setError(`Power calculation failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const executeSquareRoot = async () => {
    if (!contract || !sqrtInput) {
      setError("Please enter a value for square root")
      return
    }

    setLoading(true)
    setError("")

    try {
      const value = ethers.parseUnits(sqrtInput, 0)

      // Since calculateSquareRoot is not a view function, we need to send a transaction
      // and then get the return value from the transaction receipt
      const tx = await contract.calculateSquareRoot(value)
      const receipt = await tx.wait()

      // For non-view functions that return values, we need to simulate the call first
      // to get the return value, then send the actual transaction
      try {
        // First, simulate the call to get the return value
        const simulatedResult = await contract.calculateSquareRoot.staticCall(value)
        setResult(simulatedResult.toString())
      } catch (simulationError) {
        // If static call fails, the transaction was still sent, so we inform the user
        setResult(`Transaction successful. Hash: ${tx.hash}`)
      }
    } catch (err: any) {
      setError(`Square root calculation failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setResult("")
    setError("")
    setInputA("")
    setInputB("")
    setBase("")
    setExponent("")
    setSqrtInput("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Calculator className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Smart Calculator</h1>
          </div>
          <p className="text-slate-600">Blockchain-powered calculator with scientific functions</p>
        </div>

        {/* Wallet Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Wallet Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <Button onClick={connectWallet} className="w-full">
                Connect MetaMask
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-slate-600">Connected:</span>
                    <Badge variant="secondary">{`${account.slice(0, 6)}...${account.slice(-4)}`}</Badge>
                  </div>
                </div>
                <Button onClick={disconnectWallet} variant="outline" className="w-full">
                  Disconnect Wallet
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calculator Interface */}
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Basic Operations
            </TabsTrigger>
            <TabsTrigger value="scientific" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Scientific Functions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Calculator</CardTitle>
                <CardDescription>Perform basic arithmetic operations on the blockchain</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Number</label>
                    <Input
                      type="number"
                      placeholder="Enter first number"
                      value={inputA}
                      onChange={(e) => setInputA(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Second Number</label>
                    <Input
                      type="number"
                      placeholder="Enter second number"
                      value={inputB}
                      onChange={(e) => setInputB(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <Button
                    onClick={() => executeBasicOperation("add")}
                    disabled={loading || !isConnected}
                    variant="outline"
                  >
                    Add (+)
                  </Button>
                  <Button
                    onClick={() => executeBasicOperation("subtract")}
                    disabled={loading || !isConnected}
                    variant="outline"
                  >
                    Subtract (-)
                  </Button>
                  <Button
                    onClick={() => executeBasicOperation("multiply")}
                    disabled={loading || !isConnected}
                    variant="outline"
                  >
                    Multiply (×)
                  </Button>
                  <Button
                    onClick={() => executeBasicOperation("divide")}
                    disabled={loading || !isConnected}
                    variant="outline"
                  >
                    Divide (÷)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scientific" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Power Function</CardTitle>
                  <CardDescription>Calculate base raised to exponent</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Base</label>
                    <Input
                      type="number"
                      placeholder="Enter base"
                      value={base}
                      onChange={(e) => setBase(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Exponent</label>
                    <Input
                      type="number"
                      placeholder="Enter exponent"
                      value={exponent}
                      onChange={(e) => setExponent(e.target.value)}
                    />
                  </div>
                  <Button onClick={executePower} disabled={loading || !isConnected} className="w-full">
                    Calculate Power
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Square Root</CardTitle>
                  <CardDescription>Calculate square root of a number</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number</label>
                    <Input
                      type="number"
                      placeholder="Enter number"
                      value={sqrtInput}
                      onChange={(e) => setSqrtInput(e.target.value)}
                    />
                  </div>
                  <Button onClick={executeSquareRoot} disabled={loading || !isConnected} className="w-full">
                    Calculate √
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Result Display */}
        {(result || error) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Result</CardTitle>
              <Button onClick={clearResults} variant="ghost" size="sm">
                Clear
              </Button>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {result && !error && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <span className="font-mono text-lg">{result}</span>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Processing transaction...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-slate-500">
          <p>Smart Contract Calculator • Powered by Ethereum</p>
        </div>
      </div>
    </div>
  )
}
