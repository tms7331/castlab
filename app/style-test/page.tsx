"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export default function StyleTestPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Component Style Test</h1>
      
      {/* Buttons Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Default Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      {/* Cards Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description goes here</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This is the card content area where you can put any content.</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Action</Button>
            </CardFooter>
          </Card>
          
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>Hover Effect Card</CardTitle>
              <CardDescription>This card has the hover-lift class</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={66} className="mb-2" />
              <p className="text-sm text-muted-foreground">66% Complete</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Badges Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      {/* Input Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Inputs</h2>
        <div className="max-w-md space-y-4">
          <Input type="text" placeholder="Enter text..." />
          <Input type="email" placeholder="Enter email..." />
          <Input disabled placeholder="Disabled input..." />
        </div>
      </section>

      {/* Avatar Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Avatars</h2>
        <div className="flex gap-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>TM</AvatarFallback>
          </Avatar>
          <Avatar className="w-16 h-16">
            <AvatarFallback>LG</AvatarFallback>
          </Avatar>
        </div>
      </section>

      {/* Legacy Classes Test */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Legacy Classes (Still Working)</h2>
        <div className="space-y-4">
          <div className="experiment-card">
            <h3 className="text-lg font-semibold">Legacy Experiment Card</h3>
            <p>This uses the old .experiment-card class</p>
          </div>
          <button className="nav-link">Legacy Nav Link</button>
        </div>
      </section>
    </div>
  );
}