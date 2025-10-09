-- ================== USERS ==================
CREATE TABLE users (
                       id UUID PRIMARY KEY,
                       username VARCHAR(30) NOT NULL UNIQUE,
                       email VARCHAR(255) NOT NULL UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                       updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE user_roles (
                            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            role VARCHAR(20) NOT NULL,
                            PRIMARY KEY (user_id, role)
);

-- ================== CAMPAIGNS ==================
CREATE TABLE campaigns (
                           id UUID PRIMARY KEY,
                           name VARCHAR(100) NOT NULL,
                           description TEXT,
                           gm_id UUID NOT NULL REFERENCES users(id),
                           created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                           updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_campaign_gm_id ON campaigns (gm_id);

-- ================== CAMPAIGN MEMBERS ==================
CREATE TABLE campaign_members (
                                  id UUID PRIMARY KEY, ==
                                  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
                                  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                  role_in_campaign VARCHAR(20) NOT NULL,
                                  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                                  CONSTRAINT uq_campaign_member UNIQUE (campaign_id, user_id)
);

-- ================== CHARACTERS ==================
CREATE TABLE characters (
                            id UUID PRIMARY KEY,
                            name VARCHAR(100) NOT NULL,
                            clazz VARCHAR(50) NOT NULL,
                            race VARCHAR(50) NOT NULL,
                            level INT NOT NULL CHECK (level >= 1),
                            hp INT NOT NULL CHECK (hp >= 0),
                            max_hp INT NOT NULL CHECK (max_hp > 0),
                            strength INT, agility INT, stamina INT, intelligence INT, wisdom INT, charisma INT,
                            owner_id UUID NOT NULL REFERENCES users(id),
                            campaign_id UUID NOT NULL REFERENCES campaigns(id),
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_character_owner_id ON characters (owner_id);
CREATE INDEX idx_character_campaign_id ON characters (campaign_id);

-- ================== ITEMS ==================
CREATE TABLE items (
                       id UUID PRIMARY KEY,
                       name VARCHAR(100) NOT NULL,
                       description TEXT,
                       weight NUMERIC(10,2),
                       value INT
);

-- ================== CHARACTER INVENTORY ==================
CREATE TABLE character_inventory (
                                 id UUID PRIMARY KEY, ==
                                 character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
                                 item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
                                 quantity INT NOT NULL CHECK (quantity >= 1),
                                 CONSTRAINT uq_character_item UNIQUE (character_id, item_id)
);

-- ================== JOURNAL ENTRIES ==================
CREATE TABLE journal_entries (
                                 id UUID PRIMARY KEY,
                                 campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
                                 author_id UUID NOT NULL REFERENCES users(id),
                                 type VARCHAR(50) NOT NULL,
                                 visibility VARCHAR(20) NOT NULL,
                                 title VARCHAR(150),
                                 content TEXT NOT NULL,
                                 tags VARCHAR(255),
                                 created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_journal_campaign_id ON journal_entries (campaign_id);
CREATE INDEX idx_journal_author_id ON journal_entries (author_id);
CREATE INDEX idx_journal_campaign_type ON journal_entries (campaign_id, type);
CREATE INDEX idx_journal_campaign_created_at ON journal_entries (campaign_id, created_at desc)
