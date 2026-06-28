import React from 'react';
import { Heart, MessageCircle, Repeat, Share, ArrowBigUp, ArrowBigDown, MessageSquare, Award, ThumbsUp, MessageSquareText } from 'lucide-react';

interface MockupProps {
  companyName: string;
  description: string;
  founderName: string;
  logoInitial: string;
}

const SignatureCard = ({ companyName, founderName, logoInitial }: MockupProps) => (
  <div className="mt-3 flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
      {logoInitial}
    </div>
    <div>
      <div className="font-semibold">{founderName}</div>
      <div className="text-sm text-muted-foreground">Founder, {companyName}</div>
      <div className="mt-1 text-xs font-medium text-primary">Featured in Tailnote Spotlight</div>
    </div>
  </div>
);

export function BlueskyPostMockup(props: MockupProps) {
  return (
    <div className="rounded-xl border bg-background p-4 shadow-sm max-w-md w-full">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0085ff] text-white font-bold">
          T
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-bold truncate">Tailnote</span>
            <span className="text-muted-foreground text-sm truncate">@tailnote.com</span>
            <span className="text-muted-foreground text-sm">· 2h</span>
          </div>
          <p className="mt-1 text-[15px] leading-snug">
            We are thrilled to feature <strong>{props.companyName}</strong> in this week&apos;s Spotlight! 🚀
            <br /><br />
            {props.description}
          </p>
          <SignatureCard {...props} />
          <div className="mt-3 flex items-center justify-between text-muted-foreground">
            <button className="flex items-center gap-1.5 hover:text-[#0085ff] transition-colors"><MessageCircle className="h-4 w-4" /> <span className="text-xs">12</span></button>
            <button className="flex items-center gap-1.5 hover:text-green-500 transition-colors"><Repeat className="h-4 w-4" /> <span className="text-xs">45</span></button>
            <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors"><Heart className="h-4 w-4" /> <span className="text-xs">218</span></button>
            <button className="flex items-center gap-1.5 hover:text-[#0085ff] transition-colors"><Share className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RedditPostMockup(props: MockupProps) {
  return (
    <div className="rounded-xl border bg-background p-4 shadow-sm max-w-md w-full">
      <div className="flex gap-3">
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <ArrowBigUp className="h-6 w-6 text-orange-500 fill-orange-500/20" />
          <span className="text-sm font-bold text-foreground">1.2k</span>
          <ArrowBigDown className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="font-bold text-foreground">r/startups</span>
            <span>•</span>
            <span>Posted by u/tailnote_official</span>
            <span>•</span>
            <span>4 hours ago</span>
          </div>
          <h3 className="font-semibold text-lg leading-tight mb-2">
            Spotlight Winner: How {props.companyName} is changing the game
          </h3>
          <p className="text-sm text-foreground/90">
            {props.description}
          </p>
          <SignatureCard {...props} />
          <div className="mt-3 flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5 hover:bg-muted p-1 rounded transition-colors cursor-pointer">
              <MessageSquare className="h-4 w-4" /> 142 Comments
            </div>
            <div className="flex items-center gap-1.5 hover:bg-muted p-1 rounded transition-colors cursor-pointer">
              <Award className="h-4 w-4" /> Award
            </div>
            <div className="flex items-center gap-1.5 hover:bg-muted p-1 rounded transition-colors cursor-pointer">
              <Share className="h-4 w-4" /> Share
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LinkedInPostMockup(props: MockupProps) {
  return (
    <div className="rounded-xl border bg-background p-4 shadow-sm max-w-md w-full">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-12 w-12 items-center justify-center rounded bg-[#0a66c2] text-white font-bold text-xl">
          T
        </div>
        <div>
          <div className="font-bold text-sm leading-tight">Tailnote</div>
          <div className="text-xs text-muted-foreground">10,492 followers</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            1d • 🌎
          </div>
        </div>
      </div>
      <p className="text-sm leading-relaxed mb-3">
        🏆 Welcome to the Tailnote Hall of Fame! 🏆
        <br /><br />
        This week we are shining a light on <strong>{props.companyName}</strong>. 
        <br />
        {props.description}
        <br /><br />
        Check out their custom signature below and join the Spotlight network today.
      </p>
      <div className="rounded-lg border bg-muted/30 p-2 mb-3">
        <SignatureCard {...props} />
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
        <span>👍 ❤️ 👏 342</span>
        <span>•</span>
        <span>48 comments</span>
        <span>•</span>
        <span>12 reposts</span>
      </div>
      <div className="border-t pt-2 flex justify-between px-2">
        <button className="flex items-center gap-2 text-muted-foreground hover:bg-muted px-3 py-2 rounded-md font-medium text-sm transition-colors">
          <ThumbsUp className="h-4 w-4" /> Like
        </button>
        <button className="flex items-center gap-2 text-muted-foreground hover:bg-muted px-3 py-2 rounded-md font-medium text-sm transition-colors">
          <MessageSquareText className="h-4 w-4" /> Comment
        </button>
        <button className="flex items-center gap-2 text-muted-foreground hover:bg-muted px-3 py-2 rounded-md font-medium text-sm transition-colors">
          <Repeat className="h-4 w-4" /> Repost
        </button>
      </div>
    </div>
  );
}
