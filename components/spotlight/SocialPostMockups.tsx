import React from 'react';
import { Heart, MessageCircle, Repeat, Share, ArrowBigUp, ArrowBigDown, MessageSquare, Award, ThumbsUp, MessageSquareText } from 'lucide-react';

interface MockupProps {
  companyName: string;
  description: string;
  founderName: string;
  logoInitial: string;
  quote?: string;
}

import { renderMarketingSample, renderSpotlightSample } from '@/lib/marketing/renderMarketingSample';
import { stripSignaturePreviewLinks } from '@/lib/marketing/stripSignaturePreviewLinks';
import { MarketingSignaturePreview } from '@/components/marketing/MarketingSignaturePreview';

const SignatureCard = ({ quote, companyName }: { quote?: string; companyName: string }) => {
  const signatureHtml = stripSignaturePreviewLinks(
    quote ? renderSpotlightSample(quote, companyName) : renderMarketingSample('modern_professional')
  );
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border bg-card p-4 shadow-sm relative">
      <div className="absolute top-2 right-2 z-10 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-background/80 px-1 rounded">
        Tailnote Signature
      </div>
      <div className="pt-2 min-w-[500px]">
        <MarketingSignaturePreview html={signatureHtml} />
      </div>
    </div>
  );
};

export function BlueskyPostMockup(props: MockupProps) {
  return (
    <div className="rounded-xl border bg-background p-4 shadow-sm max-w-2xl w-full">
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
          <SignatureCard quote={props.quote} companyName={props.companyName} />
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
    <div className="rounded-xl border bg-background p-4 shadow-sm max-w-2xl w-full">
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
            Founder Spotlight: Check out what {props.companyName} is building
          </h3>
          <p className="text-sm text-foreground/90">
            {props.description}
          </p>
          <SignatureCard quote={props.quote} companyName={props.companyName} />
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
    <div className="rounded-xl border bg-background p-4 shadow-sm max-w-2xl w-full">
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
        🚀 We love supporting fellow founders! 🚀
        <br /><br />
        This week we are excited to cross-promote <strong>{props.companyName}</strong> in our Spotlight. 
        <br />
        {props.description}
        <br /><br />
        Check out their custom signature below and join the Spotlight network today.
      </p>
      <div className="rounded-lg border bg-muted/30 p-2 mb-3">
        <SignatureCard quote={props.quote} companyName={props.companyName} />
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
