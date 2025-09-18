"use client"

import { useEffect, useRef } from "react"

export function BiologicalBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let animationId: number
        let time = 0

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resizeCanvas()
        window.addEventListener("resize", resizeCanvas)

        // Create vertical streaks that flow downward
        const streaks: Array<{
            x: number
            width: number
            speed: number
            opacity: number
            color: string
            offset: number
            helixPhase: number // Added phase for helix rotation
        }> = []

        const streakCount = Math.floor(canvas.width / 45) // Increase streak density for richer background
        for (let i = 0; i < streakCount; i++) {
            streaks.push({
                x: Math.random() * canvas.width,
                width: 2 + Math.random() * 4, // Slightly thinner streaks
                speed: 0.2 + Math.random() * 0.8, // Much slower speeds
                opacity: 0.15 + Math.random() * 0.25, // Varying opacity
                color: Math.random() > 0.5 ? "blue" : "purple", // Blue or purple
                offset: Math.random() * canvas.height, // Random starting position
                helixPhase: Math.random() * Math.PI * 2, // Random phase for helix rotation
            })
        }

        const animate = () => {
            time += 0.008 // Much slower time progression

            // Clear canvas with light grey background
            ctx.fillStyle = "#f8f9fa"
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Draw flowing streaks
            streaks.forEach((streak, index) => {
                // Create gradient for each streak
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)

                if (streak.color === "blue") {
                    gradient.addColorStop(0, `rgba(59, 130, 246, 0)`) // Transparent blue
                    gradient.addColorStop(0.3, `rgba(59, 130, 246, ${streak.opacity})`) // Blue
                    gradient.addColorStop(0.7, `rgba(147, 197, 253, ${streak.opacity * 0.8})`) // Light blue
                    gradient.addColorStop(1, `rgba(59, 130, 246, 0)`) // Transparent blue
                } else {
                    gradient.addColorStop(0, `rgba(147, 51, 234, 0)`) // Transparent purple
                    gradient.addColorStop(0.3, `rgba(147, 51, 234, ${streak.opacity})`) // Purple
                    gradient.addColorStop(0.7, `rgba(196, 181, 253, ${streak.opacity * 0.8})`) // Light purple
                    gradient.addColorStop(1, `rgba(147, 51, 234, 0)`) // Transparent purple
                }

                ctx.fillStyle = gradient

                // Calculate flowing position
                const flowOffset = (time * streak.speed * 50 + streak.offset) % (canvas.height + 200) // Slower flow

                ctx.beginPath()
                const segments = 30 // More segments for smoother helix
                for (let j = 0; j <= segments; j++) {
                    const y = (j / segments) * canvas.height
                    const helixRadius = 25 // Reduced helix radius for tighter spirals
                    const helixFreq = 0.008 // Frequency of the spiral
                    const helixX = Math.sin((y + flowOffset) * helixFreq + streak.helixPhase) * helixRadius
                    const x = streak.x + helixX

                    if (j === 0) {
                        ctx.moveTo(x - streak.width / 2, y)
                    } else {
                        ctx.lineTo(x - streak.width / 2, y)
                    }
                }

                // Complete the streak shape
                for (let j = segments; j >= 0; j--) {
                    const y = (j / segments) * canvas.height
                    const helixX = Math.sin((y + flowOffset) * 0.008 + streak.helixPhase) * 25 // Updated radius here too
                    const x = streak.x + helixX
                    ctx.lineTo(x + streak.width / 2, y)
                }

                ctx.closePath()
                ctx.fill()

                // Add subtle glow effect
                ctx.shadowColor = streak.color === "blue" ? "rgba(59, 130, 246, 0.3)" : "rgba(147, 51, 234, 0.3)"
                ctx.shadowBlur = 10
                ctx.fill()
                ctx.shadowBlur = 0
            })

            animationId = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            window.removeEventListener("resize", resizeCanvas)
            if (animationId) {
                cancelAnimationFrame(animationId)
            }
        }
    }, [])

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.6 }} />
        </div>
    )
}
