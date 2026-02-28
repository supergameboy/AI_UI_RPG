import React from 'react';
import { ProgressBar } from '../common';
import styles from './PartyStatus.module.css';

interface PartyMember {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
}

const mockParty: PartyMember[] = [
  { id: '1', name: '艾琳(你)', health: 85, maxHealth: 100, mana: 45, maxMana: 60 },
];

export const PartyStatus: React.FC = () => {
  return (
    <div className={styles.partyStatus}>
      {mockParty.map((member) => (
        <div key={member.id} className={styles.member}>
          <span className={styles.name}>{member.name}</span>
          <div className={styles.bars}>
            <ProgressBar 
              value={member.health} 
              max={member.maxHealth} 
              color="health" 
              size="small" 
              showText 
              text={`HP: ${member.health}/${member.maxHealth}`}
            />
            <ProgressBar 
              value={member.mana} 
              max={member.maxMana} 
              color="mana" 
              size="small" 
              showText 
              text={`MP: ${member.mana}/${member.maxMana}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
