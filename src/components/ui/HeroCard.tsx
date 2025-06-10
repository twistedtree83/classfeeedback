import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroCardProps {
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonLink?: string;
  onPrimaryButtonClick?: () => void;
  onSecondaryButtonClick?: () => void;
  className?: string;
}

export function HeroCard({
  title = "Real-time classroom feedback and engagement",
  subtitle = "Interactive learning made simple",
  description = "Help students learn better with instant feedback, interactive lessons, and AI-powered teaching tools. Create meaningful classroom interactions that improve learning outcomes.",
  image = "https://images.pexels.com/photos/8471799/pexels-photo-8471799.jpeg?auto=compress&cs=tinysrgb&w=1600",
  imageAlt = "Classroom engagement",
  primaryButtonText = "Get Started",
  secondaryButtonText = "Join as Student",
  primaryButtonLink = "/signup",
  secondaryButtonLink = "/join",
  onPrimaryButtonClick,
  onSecondaryButtonClick,
  className,
}: HeroCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setMousePosition({ x, y });
      }
    };

    const card = cardRef.current;
    if (card) {
      card.addEventListener("mousemove", handleMouseMove);
      return () => card.removeEventListener("mousemove", handleMouseMove);
    }
  }, []);

  const parallaxStyle = {
    transform: `translate(${(mousePosition.x - 0.5) * 15}px, ${
      (mousePosition.y - 0.5) * 15
    }px)`,
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-slate-50",
        "max-w-7xl w-full mx-auto h-[85vh] min-h-[700px] max-h-[900px]",
        "shadow-large border border-border/50",
        "transition-all duration-700 hover:shadow-2xl hover:shadow-dark-purple/20",
        "hover:-translate-y-2",
        className
      )}
    >
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-gradient-to-r from-dark-purple/20 to-deep-sky-blue/20 filter blur-3xl animate-pulse-soft"
          style={{
            transform: `translate(${(mousePosition.x - 0.5) * -30}px, ${
              (mousePosition.y - 0.5) * -30
            }px)`,
          }}
        />
        <div
          className="absolute top-1/4 right-0 w-96 h-96 rounded-full bg-gradient-to-l from-harvest-gold/15 to-sea-green/15 filter blur-3xl animate-pulse-soft"
          style={{
            transform: `translate(${(mousePosition.x - 0.5) * 25}px, ${
              (mousePosition.y - 0.5) * 25
            }px)`,
            animationDelay: "1s",
          }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-r from-bice-blue/20 to-deep-sky-blue/20 filter blur-3xl animate-pulse-soft"
          style={{
            transform: `translate(${(mousePosition.x - 0.5) * 20}px, ${
              (mousePosition.y - 0.5) * 20
            }px)`,
            animationDelay: "2s",
          }}
        />
      </div>

      <div className="relative h-full flex flex-col lg:flex-row items-center">
        {/* Content Section */}
        <div className="w-full lg:w-1/2 p-8 md:p-12 lg:p-20 flex flex-col justify-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-deep-sky-blue bg-deep-sky-blue/10 px-4 py-2 rounded-full mb-6 w-fit"
          >
            <Sparkles className="h-4 w-4" />
            {subtitle}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-balance mb-8 leading-tight"
          >
            <span className="text-dark-purple">
              {title.split(" ").slice(0, 2).join(" ")}
            </span>
            <br />
            <span className="gradient-text">
              {title.split(" ").slice(2).join(" ")}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed text-balance"
          >
            {description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              size="xl"
              variant="default"
              className="group shadow-glow-blue"
              onClick={onPrimaryButtonClick}
              asChild={!!primaryButtonLink}
            >
              {primaryButtonLink ? (
                <a href={primaryButtonLink} className="flex items-center gap-2">
                  {primaryButtonText}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </a>
              ) : (
                <div className="flex items-center gap-2">
                  {primaryButtonText}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </Button>

            <Button
              variant="glass"
              size="xl"
              className="border-dark-purple/20 text-dark-purple hover:bg-dark-purple/5"
              onClick={onSecondaryButtonClick}
              asChild={!!secondaryButtonLink}
            >
              {secondaryButtonLink ? (
                <a href={secondaryButtonLink}>{secondaryButtonText}</a>
              ) : (
                secondaryButtonText
              )}
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 flex items-center gap-8"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-sea-green" />
              <span>1000+ teachers</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4 text-harvest-gold" />
              <span>Real-time analytics</span>
            </div>
          </motion.div>
        </div>

        {/* Image Section */}
        <div className="w-full lg:w-1/2 h-full relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 1.1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute inset-0 z-0"
            style={parallaxStyle}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent z-10" />
            <img
              src={image}
              alt={imageAlt}
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Floating glass cards */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotate: -5 }}
            animate={{
              opacity: isVisible ? 1 : 0,
              y: isVisible ? 0 : 50,
              rotate: isVisible ? 0 : -5,
            }}
            transition={{ duration: 1, delay: 0.6 }}
            className="absolute bottom-16 left-8 glass backdrop-blur-md p-6 rounded-2xl shadow-large z-20 max-w-xs border border-white/30"
            style={{
              transform: `translate(${(mousePosition.x - 0.5) * -15}px, ${
                (mousePosition.y - 0.5) * -15
              }px)`,
            }}
          >
            <div className="flex items-center gap-4">
              <div className="bg-harvest-gold/20 p-3 rounded-xl">
                <BarChart3 className="h-6 w-6 text-harvest-gold" />
              </div>
              <div>
                <p className="font-semibold text-dark-purple text-sm">
                  Live Analytics
                </p>
                <p className="text-xs text-muted-foreground">
                  Real-time insights
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50, rotate: 5 }}
            animate={{
              opacity: isVisible ? 1 : 0,
              y: isVisible ? 0 : 50,
              rotate: isVisible ? 0 : 5,
            }}
            transition={{ duration: 1, delay: 0.8 }}
            className="absolute top-20 right-8 glass backdrop-blur-md p-6 rounded-2xl shadow-large z-20 max-w-xs border border-white/30"
            style={{
              transform: `translate(${(mousePosition.x - 0.5) * 10}px, ${
                (mousePosition.y - 0.5) * 10
              }px)`,
            }}
          >
            <div className="flex items-center gap-4">
              <div className="bg-sea-green/20 p-3 rounded-xl">
                <Users className="h-6 w-6 text-sea-green" />
              </div>
              <div>
                <p className="font-semibold text-dark-purple text-sm">
                  Student Engagement
                </p>
                <p className="text-xs text-muted-foreground">
                  Active participation
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
